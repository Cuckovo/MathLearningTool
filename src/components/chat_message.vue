<template>
  <view class="message-wrapper" :class="`message-wrapper--${message.role}`">
    <view class="chat-bubble" :class="`chat-bubble--${message.role}`">
      <!-- AI 消息：使用 LaTeX 渲染 -->
      <template v-if="message.role === 'assistant'">
        <latex-renderer :content="message.content" />

        <!-- 函数绘图 tag：仅当 AI 判断可绘制时展示 -->
        <view v-if="message.hasFunction && message.functionExpr" class="fn-tag">
          <!-- 坐标轴曲线小图标 -->
          <svg class="fn-tag__icon" viewBox="70 8 40 33" width="14" height="14">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M100.3 17.2C98.8001 15.2 96.3001 14 93.1001 13.8C93.2001 13.5 93.2001 13.2 93.2001 12.9C93.2001 12.3 93.0001 11.7 92.8001 11.2C97.1001 11.3 100.8 13.2 102.8 16.2C101.8 16.2 101 16.6 100.3 17.2ZM86.4001 15.4C85.8001 14.7 85.4001 13.8 85.4001 12.9V12.8C82.6001 14.1 80.2001 16.2 78.4001 18.7C79.3001 19 80.1001 19.7 80.6001 20.5C80.7001 20.3 80.8001 20.1 81.0001 19.9C82.2001 18.2 83.9001 16.7 86.0001 15.6C86.0619 15.5382 86.1237 15.5146 86.2091 15.482C86.2619 15.4618 86.3237 15.4382 86.4001 15.4ZM78.6001 26.1C78.2001 26.2 77.7001 26.3 77.2001 26.3C76.7001 26.3 76.2001 26.2 75.8001 26C75.7001 27.8 75.9001 29.5 76.8001 31.4C77.3001 32.5 78.0001 33.4 78.8001 34.2C79.2001 33.3 79.8001 32.6 80.7001 32.2C80.2001 31.6 79.8001 31 79.4001 30.3C78.8001 29 78.5001 27.5 78.6001 26.1ZM86.7001 35.1C86.6001 35.1 86.5251 35.075 86.4501 35.05C86.3751 35.025 86.3001 35 86.2001 35C86.2001 35.0899 86.2203 35.1798 86.2425 35.2788C86.2698 35.4 86.3001 35.5348 86.3001 35.7C86.3001 36.4 86.1001 37.1 85.7001 37.7C88.5001 38.1 91.7001 37.7 94.7001 36.4C94.1001 35.8 93.7001 34.9 93.6001 34C91.3001 35 88.8001 35.4 86.7001 35.1ZM101.9 23.8C102.2 23.9 102.5 24 102.9 24C103.5 24 104.1 23.8 104.6 23.6C104.4 25.7 103.6 28.2 101.9 30.6C101.75 30.8 101.575 31 101.4 31.2C101.225 31.4 101.05 31.6 100.9 31.8C100.5 31 99.8001 30.3 98.9001 30C99.0001 29.9 99.1001 29.775 99.2001 29.65C99.3001 29.525 99.4001 29.4 99.5001 29.3C100.9 27.4 101.7 25.5 101.9 23.8Z"
              fill="currentColor"
            />
          </svg>

          <text class="fn-tag__label">可绘图</text>

          <!-- 分隔点 -->
          <view class="fn-tag__dot" />

          <!-- 函数表达式 -->
          <text class="fn-tag__expr">{{ message.functionExpr }}</text>
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

/* ── 函数绘图 tag ── */
.fn-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: var(--space-2);
  padding: 4px 10px 4px 8px;
  border-radius: 999px;
  background: rgba(144, 194, 8, 0.1);
  border: 1px solid rgba(144, 194, 8, 0.35);
  max-width: 100%;
  overflow: hidden;
}

.fn-tag__icon {
  flex-shrink: 0;
  color: #90c208;
}

.fn-tag__label {
  font-size: 11px;
  font-weight: 600;
  color: #90c208;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.2px;
}

.fn-tag__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(144, 194, 8, 0.5);
  flex-shrink: 0;
}

.fn-tag__expr {
  font-size: 11px;
  color: var(--color-text-secondary, rgba(34, 34, 34, 0.7));
  font-family: 'Courier New', Courier, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
</style>
