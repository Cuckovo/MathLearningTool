/**
 * DeepSeek API 服务封装
 */

import type { ChatMessage } from '../types'
import { SYSTEM_PROMPT } from '../utils/constants'
import { getConfig } from '../utils/env_config'

interface DeepSeekChatParams {
  apiKey: string
  messages: ChatMessage[]
}

interface DeepSeekResponse {
  choices: {
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }[]
}

/** 构建带系统提示词的消息列表 */
function buildMessages(messages: ChatMessage[]): ChatMessage[] {
  const systemMsg: ChatMessage = {
    role: 'system',
    content: SYSTEM_PROMPT,
    timestamp: Date.now(),
  }
  return [systemMsg, ...messages]
}

/** 调用 DeepSeek Chat API */
async function callDeepSeekApi(
  apiKey: string,
  messages: ChatMessage[],
  temperature: number = 0.7,
): Promise<string> {
  const baseUrl = getConfig('deepseekApiBaseUrl')
  const model = getConfig('deepseekModel')
  const url = `${baseUrl}/chat/completions`

  const requestBody = {
    model,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API 错误 (${response.status}): ${errorText}`)
  }

  const data: DeepSeekResponse = await response.json()
  if (!data.choices || data.choices.length === 0) {
    throw new Error('DeepSeek API 返回空响应')
  }

  return data.choices[0].message.content
}

/** 发送消息并返回 AI 响应 */
export async function sendMessage(params: DeepSeekChatParams): Promise<ChatMessage> {
  const { apiKey, messages } = params
  const fullMessages = buildMessages(messages)
  const content = await callDeepSeekApi(apiKey, fullMessages)

  return {
    role: 'assistant',
    content,
    timestamp: Date.now(),
  }
}

/** 验证 API Key 是否有效 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const testMessages: ChatMessage[] = [
      {
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      },
    ]
    const fullMessages = buildMessages(testMessages)
    await callDeepSeekApi(apiKey, fullMessages, 0.1)
    return true
  } catch (error) {
    console.warn('[DeepSeekService] API Key 验证失败:', error)
    return false
  }
}

/** 生成对话摘要 */
export async function summarize(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const summaryPrompt: ChatMessage = {
    role: 'system',
    content: '请用一句话（不超过20字）总结以下对话的核心内容，不要输出其他内容。',
    timestamp: Date.now(),
  }

  const summaryMessages = [
    summaryPrompt,
    ...messages.filter((m) => m.role !== 'system'),
  ]

  const content = await callDeepSeekApi(apiKey, summaryMessages, 0.3)
  return content.trim()
}
