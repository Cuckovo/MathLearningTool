<template>
  <view class="api-key-init">
    <view class="init-header">
      <view class="brand">
        <view class="brand-dot"></view>
        <text class="brand-title">{{ appTitle }}</text>
      </view>
      <text class="init-desc">首次使用需要配置 DeepSeek API Key</text>
    </view>

    <view class="init-form">
      <view class="field">
        <text class="label">API Key</text>
        <view class="input-wrapper">
          <input
            class="input"
            :type="showKey ? 'text' : 'password'"
            v-model="apiKeyInput"
            placeholder="请输入 DeepSeek API Key"
            :disabled="isValidating"
          />
          <view class="toggle-visibility" @tap="showKey = !showKey">
            <text>{{ showKey ? '🔒' : '👁️' }}</text>
          </view>
        </view>
      </view>

      <view class="field">
        <button
          class="btn btn-primary validate-btn"
          :disabled="!apiKeyInput.trim() || isValidating"
          @tap="handleValidate"
        >
          <view v-if="isValidating" class="loading-spinner"></view>
          <text>{{ isValidating ? '验证中...' : '验证并保存' }}</text>
        </button>
      </view>

      <view v-if="errorMsg" class="alert alert-danger">
        <text>{{ errorMsg }}</text>
      </view>
    </view>

    <view class="init-guide">
      <text class="guide-title">如何获取 DeepSeek API Key？</text>
      <text class="guide-step">1. 访问 DeepSeek 开放平台</text>
      <text
        class="guide-link"
        @tap="openDeepSeekPlatform"
      >https://platform.deepseek.com</text>
      <text class="guide-step">2. 注册并登录账号</text>
      <text class="guide-step">3. 在 API Keys 页面创建新的 Key</text>
      <text class="guide-step">4. 复制 Key 粘贴到上方输入框</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../stores/app_store'
import { getConfig } from '../../utils/env_config'

const appStore = useAppStore()
const appTitle = getConfig('appTitle')

const apiKeyInput = ref<string>('')
const showKey = ref<boolean>(false)
const isValidating = ref<boolean>(false)
const errorMsg = ref<string>('')

async function handleValidate(): Promise<void> {
  const key = apiKeyInput.value.trim()
  if (!key) return

  isValidating.value = true
  errorMsg.value = ''

  try {
    const isValid = await appStore.initApiKey(key)
    if (isValid) {
      // 验证成功，跳转到主页面
      uni.switchTab({ url: '/pages/ai_chat/index' })
    } else {
      errorMsg.value = 'API Key 验证失败，请检查 Key 是否正确。'
    }
  } catch (error) {
    errorMsg.value = `验证出错：${error instanceof Error ? error.message : String(error)}`
  } finally {
    isValidating.value = false
  }
}

function openDeepSeekPlatform(): void {
  // #ifdef H5
  window.open('https://platform.deepseek.com', '_blank')
  // #endif
  // #ifndef H5
  uni.setClipboardData({
    data: 'https://platform.deepseek.com',
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'success' })
    },
  })
  // #endif
}
</script>

<style scoped>
.api-key-init {
  min-height: 100vh;
  padding: var(--space-6) var(--space-4);
  background: var(--color-bg-page);
}

.init-header {
  text-align: center;
  margin-bottom: var(--space-8);
  padding-top: var(--space-8);
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.brand-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--dayq-brand-green-1), var(--dayq-brand-green-2));
}

.brand-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text-primary);
}

.init-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.init-form {
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  border: 1px solid var(--color-border-soft);
}

.field {
  margin-bottom: var(--space-4);
}

.label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper .input {
  flex: 1;
  padding-right: 44px;
}

.toggle-visibility {
  position: absolute;
  right: var(--space-3);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.validate-btn {
  width: 100%;
  height: 48px;
  font-size: var(--font-size-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.init-guide {
  background: var(--color-primary-soft);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  border: 1px solid rgba(144, 194, 8, 0.35);
}

.guide-title {
  display: block;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  margin-bottom: var(--space-3);
}

.guide-step {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
  line-height: 1.6;
}

.guide-link {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-link);
  margin-bottom: var(--space-2);
  word-break: break-all;
}

.alert-danger {
  background: var(--color-danger-soft);
  border-color: rgba(255, 90, 71, 0.35);
  color: #9d2b1e;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--font-size-sm);
  margin-top: var(--space-3);
}
</style>
