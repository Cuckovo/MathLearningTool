/**
 * 聊天状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatSession, ChatMessage, ChatListItem } from '../types'
import { DEFAULT_CHAT_TITLE } from '../utils/constants'
import * as StorageService from '../services/storage_service'
import * as DeepSeekService from '../services/deepseek_service'
import * as AiResponseParser from '../services/ai_response_parser'
import * as LatexParser from '../services/latex_parser'
import { useAppStore } from './app_store'
import { useGeogebraStore } from './geogebra_store'

export const useChatStore = defineStore('chat', () => {
  /** 聊天列表 */
  const chatList = ref<ChatListItem[]>([])
  /** 当前活跃聊天 */
  const activeChat = ref<ChatSession | null>(null)
  /** 是否正在发送 */
  const isLoading = ref<boolean>(false)
  /** 是否正在逐字输出 */
  const isTyping = ref<boolean>(false)
  /** 逐字输出 tick（每写入一个字符 +1），页面监听此值触发滚动 */
  const typingTick = ref<number>(0)

  /** 当前逐字输出定时器（用于取消） */
  let typingTimer: ReturnType<typeof setInterval> | null = null

  /** 取消逐字输出（立刻显示完整文本） */
  function cancelTyping(): void {
    if (typingTimer !== null) {
      clearInterval(typingTimer)
      typingTimer = null
    }
    isTyping.value = false
  }

  /**
   * 启动逐字输出效果
   * @param message 要写入内容的消息对象
   * @param fullText 完整文本
   * @returns Promise，在逐字输出完成后 resolve
   */
  function startTypingEffect(message: ChatMessage, fullText: string): Promise<void> {
    return new Promise((resolve) => {
      // 取消可能仍在运行的旧定时器
      cancelTyping()

      message.content = ''
      let index = 0
      const speed = 25 // 毫秒/字符
      isTyping.value = true

      typingTimer = setInterval(() => {
        index++
        message.content = fullText.substring(0, index)
        typingTick.value++

        if (index >= fullText.length) {
          clearInterval(typingTimer!)
          typingTimer = null
          isTyping.value = false
          resolve()
        }
      }, speed)
    })
  }

  /** 当前聊天是否可绘制函数 */
  const canPlot = computed<boolean>(() => {
    if (!activeChat.value) return false
    const messages = activeChat.value.messages
    // 从最后一条 AI 消息判断
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].hasFunction) {
        return true
      }
    }
    return false
  })

  /** 是否可总结（至少有一条 AI 消息） */
  const canSummarize = computed<boolean>(() => {
    if (!activeChat.value) return false
    return activeChat.value.messages.some((m) => m.role === 'assistant')
  })

  /** 生成唯一 ID */
  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
  }

  /** 加载聊天列表 */
  function loadChats(): void {
    chatList.value = StorageService.getChatList()
  }

  /** 创建新聊天 */
  function createChat(): ChatSession {
    const chat: ChatSession = {
      id: generateId(),
      title: DEFAULT_CHAT_TITLE,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    StorageService.saveChat(chat)
    loadChats()
    activeChat.value = chat
    return chat
  }

  /** 切换到指定聊天 */
  function switchChat(id: string): void {
    const chat = StorageService.getChat(id)
    if (chat) {
      activeChat.value = chat
    }
  }

  /** 发送消息 */
  async function sendMessage(content: string): Promise<void> {
    const appStore = useAppStore()

    // 确保有活跃聊天
    if (!activeChat.value) {
      createChat()
    }

    const chat = activeChat.value as ChatSession

    // 添加用户消息
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    chat.messages.push(userMessage)

    // 更新标题（第一条消息的前 20 字符）
    if (chat.messages.filter((m) => m.role === 'user').length === 1) {
      chat.title = content.substring(0, 20) + (content.length > 20 ? '...' : '')
    }

    // 临时保存（含用户消息）
    chat.updatedAt = Date.now()
    StorageService.saveChat(chat)
    loadChats()

    // 调用 AI
    isLoading.value = true
    try {
      const aiMessage = await DeepSeekService.sendMessage({
        apiKey: appStore.apiKey,
        messages: chat.messages,
      })

      // 解析 AI 响应（提取结构化字段）
      const parsed = AiResponseParser.parse(aiMessage.content)
      const fullContent = parsed.solvingProcess || aiMessage.content

      // 完善 AI 消息元数据（content 先置空，由逐字输出填充）
      aiMessage.content = ''
      aiMessage.hasFunction = parsed.canPlot
      aiMessage.functionExpr = parsed.functionExpr

      chat.messages.push(aiMessage)

      // 先保存空内容版本（用于本地恢复时不丢消息）
      chat.updatedAt = Date.now()
      StorageService.saveChat(chat)
      loadChats()
      activeChat.value = { ...chat }

      // 先关闭 loading spinner，让逐字输出接管视觉反馈
      isLoading.value = false

      // 启动逐字输出
      await startTypingEffect(aiMessage, fullContent)

      // 逐字输出完成后：提取 LaTeX + 保存最终版本
      const latexList = LatexParser.extractLatex(fullContent)
      aiMessage.latex = latexList
      chat.updatedAt = Date.now()
      StorageService.saveChat(chat)
      loadChats()
      activeChat.value = { ...chat }
    } catch (error) {
      console.error('[ChatStore] 发送消息失败:', error)
      isLoading.value = false
      // 添加错误提示消息
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `请求失败，请检查网络连接和 API Key 是否有效。\n错误：${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
      }
      chat.messages.push(errorMsg)
      chat.updatedAt = Date.now()
      StorageService.saveChat(chat)
      loadChats()
      activeChat.value = { ...chat }
    }
  }

  /** 请求 AI 总结当前对话（弹窗模式，保留兼容） */
  async function requestSummary(): Promise<string> {
    const appStore = useAppStore()
    if (!activeChat.value) return ''

    const messages = activeChat.value.messages.filter((m) => m.role !== 'system')
    if (messages.length === 0) return ''

    try {
      const summary = await DeepSeekService.summarize(appStore.apiKey, messages)
      return summary
    } catch (error) {
      console.error('[ChatStore] 总结请求失败:', error)
      return '总结请求失败，请稍后重试。'
    }
  }

  /** 请求 AI 输出手写书面解题过程（后台静默发送 prompt，仅展示 AI 回复） */
  async function requestMathSolution(): Promise<void> {
    const appStore = useAppStore()
    if (!activeChat.value) {
      console.warn('[ChatStore] 无活跃对话，跳过数学解题请求')
      return
    }

    const prompt = `请针对以上数学问题，给出完整的「手写书面风格」解题过程。

要求：
1. 使用规范的数学语言与符号
2. 所有公式必须使用 LaTeX 语法（行内公式用 $...$，独立公式用 $$...$$）
3. 步骤分层清晰，按「解」「已知」「推导」「代入」「化简」「验证」「答」等环节组织
4. 最终结果用 \\boxed{结果} 标出
5. 适当补充文字说明，模拟手写答题纸的排版节奏`

    const chat = activeChat.value

    // 构建静默消息列表：现有对话 + 提示词（不写入 chat.messages）
    const promptMessage: ChatMessage = {
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    }
    const apiMessages = [...chat.messages, promptMessage]

    // 立即显示思考中，提示词不在前端展示
    isLoading.value = true

    try {
      const aiMessage = await DeepSeekService.sendMessage({
        apiKey: appStore.apiKey,
        messages: apiMessages,
      })

      // 解析 AI 响应（提取结构化字段）
      const parsed = AiResponseParser.parse(aiMessage.content)
      const fullContent = parsed.solvingProcess || aiMessage.content

      // 完善 AI 消息元数据（content 先置空，由逐字输出填充）
      aiMessage.content = ''
      aiMessage.hasFunction = parsed.canPlot
      aiMessage.functionExpr = parsed.functionExpr

      // 仅将 AI 回复写入对话
      chat.messages.push(aiMessage)
      chat.updatedAt = Date.now()

      StorageService.saveChat(chat)
      loadChats()
      activeChat.value = { ...chat }

      // 先关闭 loading，让逐字输出接管
      isLoading.value = false

      // 启动逐字输出
      await startTypingEffect(aiMessage, fullContent)

      // 完成后提取 LaTeX
      const latexList = LatexParser.extractLatex(fullContent)
      aiMessage.latex = latexList
      chat.updatedAt = Date.now()
      StorageService.saveChat(chat)
      loadChats()
      activeChat.value = { ...chat }
    } catch (error) {
      console.error('[ChatStore] 数学解题请求失败:', error)
      isLoading.value = false
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `解题请求失败，请稍后重试。\n错误：${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
      }
      chat.messages.push(errorMsg)
      chat.updatedAt = Date.now()
      StorageService.saveChat(chat)
      loadChats()
      activeChat.value = { ...chat }
    }
  }

  /** 发送函数表达式到 GeoGebra */
  function sendToGeoGebra(): void {
    console.log('[ChatStore] sendToGeoGebra called')
    if (!activeChat.value) {
      console.log('[ChatStore] No active chat, aborting')
      return
    }

    const messages = activeChat.value.messages
    console.log('[ChatStore] Searching for function expression in', messages.length, 'messages')
    
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].hasFunction && messages[i].functionExpr) {
        console.log('[ChatStore] Found function expression:', messages[i].functionExpr)
        const geogebraStore = useGeogebraStore()
        geogebraStore.setPending(messages[i].functionExpr as string)
        console.log('[ChatStore] 切换到 GeoGebra 视图')
        geogebraStore.switchView('geo')
        return
      }
    }
    console.log('[ChatStore] No function expression found in messages')
  }

  /** 删除聊天 */
  function deleteChat(id: string): void {
    StorageService.deleteChat(id)
    loadChats()

    // 如果删除的是当前活跃聊天，清空
    if (activeChat.value && activeChat.value.id === id) {
      activeChat.value = null
    }
  }

  /** 导出聊天 */
  function exportChats(): string {
    return StorageService.exportChats()
  }

  return {
    chatList,
    activeChat,
    isLoading,
    isTyping,
    typingTick,
    canPlot,
    canSummarize,
    loadChats,
    createChat,
    switchChat,
    sendMessage,
    requestSummary,
    requestMathSolution,
    sendToGeoGebra,
    deleteChat,
    exportChats,
    cancelTyping,
  }
})
