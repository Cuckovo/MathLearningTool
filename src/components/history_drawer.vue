<template>
  <view class="history-drawer">
    <!-- 遮罩层 -->
    <view
      class="drawer-overlay"
      :class="{ 'drawer-overlay--hidden': !visible }"
      @tap="handleClose"
    ></view>

    <!-- 抽屉面板 -->
    <view class="drawer-panel drawer-panel--left" :class="{ 'drawer-panel--visible': visible }">
      <view class="drawer-header">
        <text class="drawer-title">历史记录</text>
        <view class="drawer-actions">
          <view class="export-btn" @tap="handleExport">
            <text>导出</text>
          </view>
          <view class="close-btn" @tap="handleClose">
            <text>✕</text>
          </view>
        </view>
      </view>

      <!-- 聊天列表 -->
      <scroll-view class="drawer-list" scroll-y>
        <view v-if="chatList.length === 0" class="empty-state">
          <text class="empty-state__icon">📭</text>
          <text>暂无对话记录</text>
        </view>

        <view
          v-for="item in chatList"
          :key="item.id"
          class="chat-item"
          :class="{ 'chat-item--active': isActive(item.id) }"
          @tap="handleSelect(item.id)"
        >
          <view class="chat-item-info">
            <text class="chat-item-title">{{ item.title }}</text>
            <text class="chat-item-time">{{ formatTime(item.updatedAt) }}</text>
          </view>
          <view class="chat-item-delete" @tap.stop="handleDelete(item.id)">
            <text>🗑️</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from '../stores/chat_store'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', id: string): void
  (e: 'delete', id: string): void
  (e: 'export'): void
}>()

const chatStore = useChatStore()
const chatList = computed(() => chatStore.chatList)

function isActive(id: string): boolean {
  return chatStore.activeChat?.id === id
}

function handleClose(): void {
  emit('close')
}

function handleSelect(id: string): void {
  emit('select', id)
}

function handleDelete(id: string): void {
  emit('delete', id)
}

function handleExport(): void {
  emit('export')
}

/** 格式化时间 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}
</script>

<style scoped>
.history-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  pointer-events: none;
}

.drawer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  transition: opacity 0.3s ease;
  pointer-events: auto;
}

.drawer-overlay--hidden {
  opacity: 0;
  pointer-events: none;
}

.drawer-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 80%;
  max-width: 360px;
  background: var(--color-bg-surface);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  display: flex;
  flex-direction: column;
}

.drawer-panel--visible {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-soft);
  flex-shrink: 0;
}

.drawer-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-primary);
}

.drawer-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.export-btn {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-md);
  cursor: pointer;
}

.drawer-list {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-soft);
  cursor: pointer;
  transition: background 0.15s ease;
}

.chat-item:active {
  background: var(--color-bg-page);
}

.chat-item--active {
  background: var(--color-primary-soft);
  border-left: 3px solid var(--color-primary);
}

.chat-item-info {
  flex: 1;
  min-width: 0;
}

.chat-item-title {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-item-time {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.chat-item-delete {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  cursor: pointer;
  flex-shrink: 0;
}

.chat-item-delete:active {
  background: var(--color-danger-soft);
}
</style>
