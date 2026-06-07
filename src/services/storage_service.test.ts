/**
 * StorageService 单元测试
 * 测试 getChatList / getChat / saveChat / deleteChat / FIFO 清理 / API Key 存取 / exportChats
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock uni API for non-H5 path
const storage: Record<string, string> = {}

vi.stubGlobal('uni', {
  getStorageSync: (key: string) => storage[key] || '',
  setStorageSync: (key: string, value: string) => { storage[key] = value },
  removeStorageSync: (key: string) => { delete storage[key] },
})

// We need to mock the constants import because env_config depends on import.meta.env
vi.mock('../utils/env_config', () => ({
  getConfig: (key: string) => {
    const defaults: Record<string, unknown> = {
      storageKeyPrefix: 'mlt_',
      maxChatCount: 10,
      maxMessagesPerChat: 100,
    }
    return defaults[key]
  },
  getEnvConfig: () => ({
    storageKeyPrefix: 'mlt_',
    maxChatCount: 10,
    maxMessagesPerChat: 100,
  }),
}))

import {
  getChatList,
  getChat,
  saveChat,
  deleteChat,
  getApiKey,
  setApiKey,
  exportChats,
  enforceChatLimit,
} from '../services/storage_service'
import type { ChatSession } from '../types'

// Helper: create a ChatSession
function createChat(id: string, title: string, updatedAt: number): ChatSession {
  return {
    id,
    title,
    messages: [],
    createdAt: updatedAt - 1000,
    updatedAt,
  }
}

describe('StorageService', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    // Clear our mock uni storage
    for (const key of Object.keys(storage)) {
      delete storage[key]
    }
  })

  describe('getChatList', () => {
    it('should return empty array when no data', () => {
      const list = getChatList()
      expect(list).toEqual([])
    })

    it('should return parsed list when data exists', () => {
      const listData = [{ id: '1', title: 'Test', updatedAt: 1000 }]
      localStorage.setItem('mlt_chat_list', JSON.stringify(listData))
      const list = getChatList()
      expect(list).toEqual(listData)
    })

    it('should return empty array when data is invalid JSON', () => {
      localStorage.setItem('mlt_chat_list', 'invalid{json')
      const list = getChatList()
      expect(list).toEqual([])
    })
  })

  describe('getChat', () => {
    it('should return null when chat does not exist', () => {
      const chat = getChat('nonexistent')
      expect(chat).toBeNull()
    })

    it('should return parsed chat when exists', () => {
      const chatData = createChat('abc', 'Test Chat', 2000)
      localStorage.setItem('mlt_chat_abc', JSON.stringify(chatData))
      const chat = getChat('abc')
      expect(chat).toEqual(chatData)
    })

    it('should return null when data is invalid JSON', () => {
      localStorage.setItem('mlt_chat_abc', 'not-json')
      const chat = getChat('abc')
      expect(chat).toBeNull()
    })
  })

  describe('saveChat', () => {
    it('should save chat data and update list index', () => {
      const chat = createChat('chat1', 'Hello', 1000)
      saveChat(chat)

      // Verify chat data saved
      const saved = localStorage.getItem('mlt_chat_chat1')
      expect(saved).not.toBeNull()
      expect(JSON.parse(saved!)).toEqual(chat)

      // Verify list index updated
      const list = getChatList()
      expect(list).toHaveLength(1)
      expect(list[0].id).toBe('chat1')
      expect(list[0].title).toBe('Hello')
    })

    it('should update existing chat in list index', () => {
      const chat = createChat('chat1', 'Original', 1000)
      saveChat(chat)

      const updated = { ...chat, title: 'Updated', updatedAt: 2000 }
      saveChat(updated)

      const list = getChatList()
      expect(list).toHaveLength(1)
      expect(list[0].title).toBe('Updated')
    })

    it('should sort list by updatedAt descending', () => {
      const chat1 = createChat('chat1', 'First', 1000)
      const chat2 = createChat('chat2', 'Second', 2000)
      const chat3 = createChat('chat3', 'Third', 1500)

      saveChat(chat1)
      saveChat(chat2)
      saveChat(chat3)

      const list = getChatList()
      expect(list[0].id).toBe('chat2') // most recent first
      expect(list[1].id).toBe('chat3')
      expect(list[2].id).toBe('chat1')
    })

    it('should include only id, title, updatedAt in list item', () => {
      const chat = createChat('chat1', 'Test', 1000)
      chat.messages.push({ role: 'user', content: 'hi', timestamp: 1000 })
      saveChat(chat)

      const list = getChatList()
      expect(list[0]).toEqual({ id: 'chat1', title: 'Test', updatedAt: 1000 })
      // Messages should NOT be in list item
      expect('messages' in list[0]).toBe(false)
    })
  })

  describe('deleteChat', () => {
    it('should remove chat data and list index entry', () => {
      const chat = createChat('chat1', 'To Delete', 1000)
      saveChat(chat)
      expect(getChat('chat1')).not.toBeNull()

      deleteChat('chat1')
      expect(getChat('chat1')).toBeNull()
      expect(getChatList()).toHaveLength(0)
    })

    it('should not affect other chats', () => {
      const chat1 = createChat('chat1', 'Keep', 1000)
      const chat2 = createChat('chat2', 'Delete', 2000)
      saveChat(chat1)
      saveChat(chat2)

      deleteChat('chat2')
      expect(getChat('chat1')).not.toBeNull()
      expect(getChatList()).toHaveLength(1)
      expect(getChatList()[0].id).toBe('chat1')
    })

    it('should handle deleting non-existent chat gracefully', () => {
      deleteChat('nonexistent') // Should not throw
      expect(getChatList()).toEqual([])
    })
  })

  describe('FIFO 清理 (enforceChatLimit)', () => {
    it('should not remove chats when count <= MAX_CHAT_COUNT', () => {
      // Save 10 chats (the max)
      for (let i = 0; i < 10; i++) {
        saveChat(createChat(`chat${i}`, `Chat ${i}`, 1000 + i * 100))
      }

      const list = getChatList()
      expect(list).toHaveLength(10)
    })

    it('should remove oldest chats when count > MAX_CHAT_COUNT', () => {
      // Save 12 chats, the oldest 2 should be removed
      for (let i = 0; i < 12; i++) {
        saveChat(createChat(`chat${i}`, `Chat ${i}`, 1000 + i * 100))
      }

      const list = getChatList()
      expect(list).toHaveLength(10)

      // The newest 10 should remain (chat2 through chat11, sorted by updatedAt desc)
      // chat0 and chat1 (oldest) should be removed
      expect(getChat('chat0')).toBeNull()
      expect(getChat('chat1')).toBeNull()
      expect(getChat('chat11')).not.toBeNull()
    })

    it('should trigger FIFO on saveChat when limit exceeded', () => {
      // Save 11 chats — the first one should be auto-deleted
      for (let i = 0; i < 11; i++) {
        saveChat(createChat(`chat${i}`, `Chat ${i}`, 1000 + i * 100))
      }

      // chat0 (oldest) should have been cleaned up
      expect(getChat('chat0')).toBeNull()
      const list = getChatList()
      expect(list).toHaveLength(10)
    })

    it('should handle FIFO with many chats exceeding limit', () => {
      for (let i = 0; i < 15; i++) {
        saveChat(createChat(`chat${i}`, `Chat ${i}`, 1000 + i * 100))
      }

      const list = getChatList()
      expect(list).toHaveLength(10)
      // chat0-chat4 should be removed
      for (let i = 0; i < 5; i++) {
        expect(getChat(`chat${i}`)).toBeNull()
      }
      // chat5-chat14 should remain
      for (let i = 5; i < 15; i++) {
        expect(getChat(`chat${i}`)).not.toBeNull()
      }
    })
  })

  describe('API Key 存取', () => {
    it('should return empty string when no API key set', () => {
      expect(getApiKey()).toBe('')
    })

    it('should save and retrieve API key', () => {
      setApiKey('sk-test-12345')
      expect(getApiKey()).toBe('sk-test-12345')
    })

    it('should overwrite API key', () => {
      setApiKey('sk-old')
      setApiKey('sk-new')
      expect(getApiKey()).toBe('sk-new')
    })
  })

  describe('exportChats', () => {
    it('should return empty JSON array when no chats', () => {
      const exported = exportChats()
      expect(JSON.parse(exported)).toEqual([])
    })

    it('should export all chats as formatted JSON', () => {
      const chat1 = createChat('chat1', 'Chat One', 1000)
      chat1.messages.push({ role: 'user', content: 'Hello', timestamp: 1000 })
      const chat2 = createChat('chat2', 'Chat Two', 2000)
      chat2.messages.push({ role: 'user', content: 'World', timestamp: 2000 })

      saveChat(chat1)
      saveChat(chat2)

      const exported = exportChats()
      const parsed = JSON.parse(exported)
      expect(parsed).toHaveLength(2)

      // Verify it includes full chat data (with messages)
      const ids = parsed.map((c: ChatSession) => c.id)
      expect(ids).toContain('chat1')
      expect(ids).toContain('chat2')
    })

    it('should produce valid pretty-printed JSON', () => {
      const chat = createChat('chat1', 'Test', 1000)
      saveChat(chat)

      const exported = exportChats()
      // Pretty printed JSON has 2-space indentation
      expect(exported).toContain('\n')
      expect(exported.substring(0, 1)).toBe('[')
    })
  })
})
