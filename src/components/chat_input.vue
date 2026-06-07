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
        <text>{{ isLoading ? '⏳' : '➤' }}</text>
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
  border-top: 1px solid var(--color-border-soft);
  padding: var(--space-2) var(--space-3);
}

.chat-input-container {
  display: flex;
  align-items: flex-end;
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
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: var(--button-primary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: 0.18s ease;
}

.send-btn:active {
  background: var(--button-primary-bg-hover);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
