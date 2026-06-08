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
        <svg class="send-btn__icon" viewBox="0 0 34 34" width="36" height="36" fill="#444444">
          <g clip-path="url(#push_clip)">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M26.245 17.4919L13.1801 11.0406L15.377 15.3232C15.6209 15.8004 15.7326 16.3342 15.7003 16.8691C15.6681 17.4039 15.4932 17.9203 15.1939 18.3647C15.1938 18.3648 15.1938 18.3649 15.1937 18.365L12.5094 22.3563L26.245 17.4919ZM28.0217 18.9844C28.3008 18.8897 28.5458 18.7145 28.7258 18.4809C28.9087 18.2433 29.016 17.9563 29.0337 17.657C29.0515 17.3577 28.9788 17.06 28.8252 16.8026C28.674 16.5493 28.4514 16.3465 28.1855 16.2195L12.7071 8.5765C12.4244 8.43724 12.105 8.39057 11.7943 8.44312C11.4835 8.49566 11.1972 8.64475 10.976 8.86921C10.7548 9.09368 10.6099 9.38212 10.5619 9.6936C10.5139 10.0051 10.5652 10.3238 10.7085 10.6044L13.5962 16.2335C13.5962 16.2336 13.5962 16.2336 13.5963 16.2337C13.6775 16.3927 13.7147 16.5706 13.7039 16.7488C13.6932 16.9271 13.6349 17.0993 13.5351 17.2474L13.5346 17.2481L10.0042 22.4975C9.82874 22.7593 9.74017 23.0697 9.75109 23.3846C9.76201 23.6996 9.87185 24.0031 10.065 24.2521C10.2582 24.5011 10.5249 24.683 10.8273 24.7718C11.1297 24.8607 11.4523 24.852 11.7495 24.7471L28.0217 18.9844Z"/>
          </g>
          <defs>
            <clipPath id="push_clip">
              <rect width="24" height="24" fill="white" transform="translate(33.8818 17.9441) rotate(138.389)"/>
            </clipPath>
          </defs>
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
  background: transparent;
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
  width: 36px;
  height: 36px;
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
