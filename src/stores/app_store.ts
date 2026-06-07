/**
 * App 全局状态管理
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as StorageService from '../services/storage_service'
import * as DeepSeekService from '../services/deepseek_service'
import { getConfig } from '../utils/env_config'

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

  /** 获取默认 API Key（从 .env 配置） */
  function getDefaultApiKey(): string {
    return getConfig('deepseekDefaultApiKey')
  }

  /** 检查初始化状态：从存储中读取，若无则尝试使用 .env 默认 Key */
  function checkInitState(): void {
    const savedKey = StorageService.getApiKey()
    if (savedKey) {
      apiKey.value = savedKey
      isInitialized.value = true
      return
    }

    // 若无已保存 Key，检查 .env 中的默认 Key
    const defaultKey = getDefaultApiKey()
    if (defaultKey) {
      // 有默认 Key，自动保存并标记为已初始化
      StorageService.setApiKey(defaultKey)
      apiKey.value = defaultKey
      isInitialized.value = true
      return
    }

    isInitialized.value = false
  }

  return {
    apiKey,
    isInitialized,
    initApiKey,
    getDefaultApiKey,
    checkInitState,
  }
})
