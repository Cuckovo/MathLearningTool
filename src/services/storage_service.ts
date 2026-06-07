/**
 * 存储服务：封装 localStorage / uni.setStorageSync 双端兼容接口
 */

import type { ChatSession, ChatListItem } from '../types'
import {
  STORAGE_KEY_API_KEY,
  STORAGE_KEY_CHAT_LIST,
  STORAGE_KEY_CHAT_PREFIX,
  MAX_CHAT_COUNT,
} from '../utils/constants'

/** 通用存储读取 */
function getStorage(key: string): string | null {
  try {
    // #ifdef H5
    return localStorage.getItem(key)
    // #endif
  } catch {
    // fallback
  }
  try {
    const value = uni.getStorageSync(key)
    return value || null
  } catch {
    return null
  }
}

/** 通用存储写入 */
function setStorage(key: string, value: string): void {
  try {
    // #ifdef H5
    localStorage.setItem(key, value)
    return
    // #endif
  } catch {
    // fallback
  }
  try {
    uni.setStorageSync(key, value)
  } catch {
    console.error(`[StorageService] 写入失败: ${key}`)
  }
}

/** 通用存储删除 */
function removeStorage(key: string): void {
  try {
    // #ifdef H5
    localStorage.removeItem(key)
    return
    // #endif
  } catch {
    // fallback
  }
  try {
    uni.removeStorageSync(key)
  } catch {
    console.error(`[StorageService] 删除失败: ${key}`)
  }
}

/** 获取聊天列表 */
export function getChatList(): ChatListItem[] {
  const raw = getStorage(STORAGE_KEY_CHAT_LIST)
  if (!raw) return []
  try {
    return JSON.parse(raw) as ChatListItem[]
  } catch {
    return []
  }
}

/** 保存聊天列表索引 */
function saveChatList(list: ChatListItem[]): void {
  setStorage(STORAGE_KEY_CHAT_LIST, JSON.stringify(list))
}

/** 获取单个聊天会话 */
export function getChat(id: string): ChatSession | null {
  const raw = getStorage(`${STORAGE_KEY_CHAT_PREFIX}${id}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ChatSession
  } catch {
    return null
  }
}

/** 保存聊天会话 */
export function saveChat(chat: ChatSession): void {
  setStorage(`${STORAGE_KEY_CHAT_PREFIX}${chat.id}`, JSON.stringify(chat))

  // 更新列表索引
  const list = getChatList()
  const index = list.findIndex((item) => item.id === chat.id)
  const listItem: ChatListItem = {
    id: chat.id,
    title: chat.title,
    updatedAt: chat.updatedAt,
  }

  if (index >= 0) {
    list[index] = listItem
  } else {
    list.push(listItem)
  }

  // 按更新时间降序排列
  list.sort((a, b) => b.updatedAt - a.updatedAt)
  saveChatList(list)

  // 触发 FIFO 清理
  enforceChatLimit()
}

/** 删除聊天会话 */
export function deleteChat(id: string): void {
  removeStorage(`${STORAGE_KEY_CHAT_PREFIX}${id}`)

  const list = getChatList()
  const filtered = list.filter((item) => item.id !== id)
  saveChatList(filtered)
}

/** 获取 API Key */
export function getApiKey(): string {
  return getStorage(STORAGE_KEY_API_KEY) || ''
}

/** 设置 API Key */
export function setApiKey(key: string): void {
  setStorage(STORAGE_KEY_API_KEY, key)
}

/** 导出全部聊天为 JSON 字符串 */
export function exportChats(): string {
  const list = getChatList()
  const chats: ChatSession[] = []
  for (const item of list) {
    const chat = getChat(item.id)
    if (chat) {
      chats.push(chat)
    }
  }
  return JSON.stringify(chats, null, 2)
}

/** FIFO 清理：超过最大数量自动删除最早记录 */
export function enforceChatLimit(): void {
  const list = getChatList()
  if (list.length <= MAX_CHAT_COUNT) return

  // 列表已按 updatedAt 降序，尾部为最旧
  const toRemove = list.slice(MAX_CHAT_COUNT)
  for (const item of toRemove) {
    removeStorage(`${STORAGE_KEY_CHAT_PREFIX}${item.id}`)
  }

  const remaining = list.slice(0, MAX_CHAT_COUNT)
  saveChatList(remaining)
}
