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

  /** 检查初始化状态：.env 中的 Key 优先级最高，若无则回退到 localStorage */
  function checkInitState(): void {
    const defaultKey = getDefaultApiKey()

    // .env 中配置了 Key → 优先使用（自动覆盖 localStorage 旧值）
    if (defaultKey) {
      const savedKey = StorageService.getApiKey()
      if (savedKey !== defaultKey) {
        // 用户更新了 .env 中的 Key，同步覆盖 localStorage
        console.log('[AppStore] .env 中 Key 与 localStorage 不一致，使用 .env 中的 Key')
        StorageService.setApiKey(defaultKey)
      }
      apiKey.value = defaultKey
      isInitialized.value = true
      return
    }

    // .env 未配置 Key → 回退到 localStorage
    const savedKey = StorageService.getApiKey()
    if (savedKey) {
      apiKey.value = savedKey
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
