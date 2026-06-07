<template>
  <view class="message-wrapper" :class="`message-wrapper--${message.role}`">
    <view class="chat-bubble" :class="`chat-bubble--${message.role}`">
      <!-- AI 消息：使用 LaTeX 渲染 -->
      <template v-if="message.role === 'assistant'">
        <latex-renderer :content="message.content" />
        <!-- 函数表达式标签 -->
        <view v-if="message.hasFunction && message.functionExpr" class="fn-tag">
          <text>📈 {{ message.functionExpr }}</text>
        </view>
      </template>

      <!-- 用户消息：纯文本 -->
      <template v-else>
        <text class="message-text">{{ message.content }}</text>
      </template>
    </view>

    <text class="message-time">{{ formatTime(message.timestamp) }}</text>
  </view>
</template>

<script setup lang="ts">
import type { ChatMessage } from '../types'
import LatexRenderer from './latex_renderer.vue'

defineProps<{
  message: ChatMessage
}>()

/** 格式化时间戳 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
</script>

<style scoped>
.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.message-wrapper--user {
  align-self: flex-end;
  align-items: flex-end;
}

.message-wrapper--assistant {
  align-self: flex-start;
  align-items: flex-start;
}

.message-text {
  word-break: break-word;
  white-space: pre-wrap;
}

.message-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
  padding: 0 var(--space-1);
}

.fn-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  margin-top: var(--space-2);
}
</style>
