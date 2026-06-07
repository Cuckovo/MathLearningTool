/**
 * DeepSeekService 单元测试
 * 测试请求组装、validateApiKey、summarize、错误处理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env_config
vi.mock('../utils/env_config', () => ({
  getConfig: (key: string) => {
    const defaults: Record<string, unknown> = {
      deepseekApiBaseUrl: 'https://api.deepseek.com',
      deepseekModel: 'deepseek-chat',
      storageKeyPrefix: 'mlt_',
      maxChatCount: 10,
      maxMessagesPerChat: 100,
    }
    return defaults[key]
  },
}))

// Mock constants
vi.mock('../utils/constants', () => ({
  STORAGE_KEY_PREFIX: 'mlt_',
  STORAGE_KEY_API_KEY: 'mlt_api_key',
  STORAGE_KEY_CHAT_LIST: 'mlt_chat_list',
  STORAGE_KEY_CHAT_PREFIX: 'mlt_chat_',
  MAX_CHAT_COUNT: 10,
  MAX_MESSAGES_PER_CHAT: 100,
  DEFAULT_CHAT_TITLE: '新对话',
  SYSTEM_PROMPT: '你是一个高等数学解题助手。',
}))

import { sendMessage, validateApiKey, summarize } from '../services/deepseek_service'
import type { ChatMessage } from '../types'

describe('DeepSeekService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('sendMessage - 请求组装', () => {
    it('should prepend system message to messages', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'AI response', role: 'assistant' }, finish_reason: 'stop' }],
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const userMessages: ChatMessage[] = [
        { role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await sendMessage({ apiKey: 'sk-test', messages: userMessages })

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalledOnce()
      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)

      // First message should be system
      expect(body.messages[0].role).toBe('system')
      expect(body.messages[0].content).toBe('你是一个高等数学解题助手。')
      // Second should be user message
      expect(body.messages[1].role).toBe('user')
      expect(body.messages[1].content).toBe('Hello')
    })

    it('should include correct API headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'AI response', role: 'assistant' }, finish_reason: 'stop' }],
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await sendMessage({ apiKey: 'sk-mykey123', messages: [] })

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[1].headers['Authorization']).toBe('Bearer sk-mykey123')
      expect(callArgs[1].headers['Content-Type']).toBe('application/json')
    })

    it('should return ChatMessage with role=assistant', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Hello back', role: 'assistant' }, finish_reason: 'stop' }],
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await sendMessage({ apiKey: 'sk-test', messages: [] })
      expect(result.role).toBe('assistant')
      expect(result.content).toBe('Hello back')
      expect(result.timestamp).toBeDefined()
    })

    it('should strip timestamp from messages sent to API', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'AI response', role: 'assistant' }, finish_reason: 'stop' }],
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const userMessages: ChatMessage[] = [
        { role: 'user', content: 'Test', timestamp: 1234567890 },
      ]

      await sendMessage({ apiKey: 'sk-test', messages: userMessages })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      // The API message should only have role + content, not timestamp
      const apiUserMsg = body.messages.find((m: { role: string }) => m.role === 'user')
      expect(apiUserMsg.role).toBe('user')
      expect(apiUserMsg.content).toBe('Test')
      expect(apiUserMsg.timestamp).toBeUndefined()
    })
  })

  describe('validateApiKey', () => {
    it('should return true on successful API call', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Hi', role: 'assistant' }, finish_reason: 'stop' }],
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await validateApiKey('sk-valid')
      expect(result).toBe(true)
    })

    it('should return false on API error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await validateApiKey('sk-invalid')
      expect(result).toBe(false)
    })

    it('should return false on network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.stubGlobal('fetch', mockFetch)

      const result = await validateApiKey('sk-test')
      expect(result).toBe(false)
    })

    it('should send test message with low temperature', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Hi', role: 'assistant' }, finish_reason: 'stop' }],
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await validateApiKey('sk-test')

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.temperature).toBe(0.1)
    })
  })

  describe('summarize', () => {
    it('should inject summary system prompt', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '二次函数极值问题', role: 'assistant' }, finish_reason: 'stop' }],
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const messages: ChatMessage[] = [
        { role: 'user', content: '求解极值', timestamp: Date.now() },
        { role: 'assistant', content: '结果', timestamp: Date.now() },
      ]

      const result = await summarize('sk-test', messages)
      expect(result).toBe('二次函数极值问题')

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      // First message should be summary system prompt
      expect(body.messages[0].role).toBe('system')
      expect(body.messages[0].content).toContain('总结')
    })

    it('should filter out system role messages from input', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Summary', role: 'assistant' }, finish_reason: 'stop' }],
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const messages: ChatMessage[] = [
        { role: 'system', content: 'Old system prompt', timestamp: Date.now() },
        { role: 'user', content: 'Question', timestamp: Date.now() },
      ]

      await summarize('sk-test', messages)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      // Only the summary system prompt + user message, old system msg filtered
      const systemMsgs = body.messages.filter((m: { role: string }) => m.role === 'system')
      expect(systemMsgs).toHaveLength(1)
      expect(systemMsgs[0].content).toContain('总结')
    })
  })

  describe('错误处理', () => {
    it('should throw on non-ok response with status code', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited'),
      })
      vi.stubGlobal('fetch', mockFetch)

      await expect(sendMessage({ apiKey: 'sk-test', messages: [] })).rejects.toThrow('429')
    })

    it('should throw on empty choices array', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [] }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await expect(sendMessage({ apiKey: 'sk-test', messages: [] })).rejects.toThrow('空响应')
    })

    it('should throw on missing choices field', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })
      vi.stubGlobal('fetch', mockFetch)

      await expect(sendMessage({ apiKey: 'sk-test', messages: [] })).rejects.toThrow('空响应')
    })

    it('should throw on network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
      vi.stubGlobal('fetch', mockFetch)

      await expect(sendMessage({ apiKey: 'sk-test', messages: [] })).rejects.toThrow('Failed to fetch')
    })
  })
})
