<template>
  <view class="chat-input-wrapper safe-area-bottom">
    <view class="chat-input-container">
      <textarea
        class="chat-textarea"
        v-model="inputText"
        :placeholder="disabled ? 'AI 正在思考...' : '输入数学问题...'"
        :disabled="disabled"
        :auto-height="true"
        :maxlength="-1"
        :adjust-position="true"
        @keydown.enter="handleKeyDown"
      />
      <button
        class="send-btn"
        :disabled="!canSend"
        @tap="handleSend"
      >
        <!-- #ifdef H5 -->
        <svg class="send-btn__icon" viewBox="0 0 25 25" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M18.6354 5.45438L5.12267 10.906L9.78072 12.1186C10.2991 12.2543 10.7717 12.5265 11.1493 12.9067C11.5269 13.2869 11.7957 13.7612 11.9279 14.2804C11.9279 14.2806 11.928 14.2807 11.928 14.2808L13.1184 18.9411L18.6354 5.45438ZM20.9319 5.12262C21.0471 4.85135 21.0796 4.55196 21.0251 4.26209C20.9697 3.96745 20.827 3.69627 20.6155 3.48376C20.404 3.27126 20.1335 3.12724 19.8392 3.07043C19.5496 3.01453 19.25 3.04556 18.9782 3.15944L2.96942 9.61802C2.67728 9.73623 2.42978 9.94345 2.26206 10.2103C2.09434 10.4771 2.01493 10.79 2.03509 11.1045C2.05525 11.419 2.17397 11.7192 2.37438 11.9624C2.57478 12.2056 2.84671 12.3795 3.15157 12.4595L9.27403 14.0533C9.2741 14.0534 9.27416 14.0534 9.27423 14.0534C9.44696 14.0987 9.60441 14.1894 9.73023 14.3161C9.85611 14.4428 9.94573 14.6009 9.98979 14.7741L9.99 14.7749L11.5556 20.9042C11.6341 21.2094 11.8067 21.4822 12.0489 21.6838C12.2912 21.8853 12.5908 22.0055 12.9052 22.0272C13.2196 22.0489 13.5328 21.971 13.8005 21.8045C14.0681 21.6381 14.2765 21.3916 14.3961 21.1L20.9319 5.12262Z" fill="#444444"/>
        </svg>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <text>{{ isLoading ? '⏳' : '➤' }}</text>
        <!-- #endif -->
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'send', content: string): void
}>()

const inputText = ref<string>('')
const isLoading = computed(() => props.disabled)

const canSend = computed<boolean>(() => {
  return inputText.value.trim().length > 0 && !props.disabled
})

/** 键盘事件：Enter 发送，Shift+Enter 换行 */
function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

/** 发送消息 */
function handleSend(): void {
  const content = inputText.value.trim()
  if (!content || props.disabled) return

  emit('send', content)
  inputText.value = ''
}
</script>

<style scoped>
.chat-input-wrapper {
  background: var(--color-bg-surface);
  padding: var(--space-2) var(--space-3);
}

.chat-input-container {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-default);
  padding: var(--space-1) var(--space-2);
}

.chat-input-container:focus-within {
  border-color: var(--color-border-brand);
  box-shadow: 0 0 0 2px var(--dayq-highlight-brand);
}

.chat-textarea {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: var(--space-2) 0;
  font-size: var(--font-size-md);
  line-height: 1.5;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: var(--color-text-primary);
}

.send-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent !important;
  background-color: transparent !important;
  border: 0 !important;
  padding: 0;
  margin: 0;
  cursor: pointer;
  flex-shrink: 0;
  transition: 0.18s ease;
  line-height: 1;
}
.send-btn::after {
  display: none !important;
}

.send-btn__icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.send-btn:active {
  opacity: 0.65;
}

.send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
