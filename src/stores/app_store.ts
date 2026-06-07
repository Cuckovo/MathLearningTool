/**
 * App 全局状态管理
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as StorageService from '../services/storage_service'
import * as DeepSeekService from '../services/deepseek_service'

export const useAppStore = defineStore('app', () => {
  /** API Key */
  const apiKey = ref<string>('')
  /** 是否已初始化（API Key 已验证并保存） */
  const isInitialized = ref<boolean>(false)

  /** 初始化 API Key：验证后保存 */
  async function initApiKey(key: string): Promise<boolean> {
    const isValid = await DeepSeekService.validateApiKey(key)
    if (isValid) {
      StorageService.setApiKey(key)
      apiKey.value = key
      isInitialized.value = true
      return true
    }
    return false
  }

  /** 检查初始化状态：从存储中读取 */
  function checkInitState(): void {
    const savedKey = StorageService.getApiKey()
    if (savedKey) {
      apiKey.value = savedKey
      isInitialized.value = true
    } else {
      isInitialized.value = false
    }
  }

  return {
    apiKey,
    isInitialized,
    initApiKey,
    checkInitState,
  }
})
