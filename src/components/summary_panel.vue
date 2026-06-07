<template>
  <view class="summary-panel">
    <!-- 遮罩层 -->
    <view
      class="drawer-overlay"
      :class="{ 'drawer-overlay--hidden': !visible }"
      @tap="handleClose"
    ></view>

    <!-- 面板 -->
    <view class="drawer-panel drawer-panel--bottom" :class="{ 'drawer-panel--visible': visible }">
      <view class="summary-header">
        <text class="summary-title">📝 对话总结</text>
        <view class="summary-actions">
          <view class="copy-btn" @tap="handleCopy">
            <text>复制</text>
          </view>
          <view class="close-btn" @tap="handleClose">
            <text>✕</text>
          </view>
        </view>
      </view>

      <scroll-view class="summary-content" scroll-y>
        <latex-renderer :content="content" />
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import LatexRenderer from './latex_renderer.vue'

defineProps<{
  visible: boolean
  content: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function handleClose(): void {
  emit('close')
}

function handleCopy(): void {
  const props = getCurrentInstance()?.props as { content: string }
  const text = props?.content || ''
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    },
  })
}
</script>

<script lang="ts">
import { getCurrentInstance } from 'vue'
</script>

<style scoped>
.summary-panel {
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
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 70vh;
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(100%);
  transition: transform 0.3s ease;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
}

.drawer-panel--visible {
  transform: translateY(0);
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-soft);
  flex-shrink: 0;
}

.summary-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.copy-btn {
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

.summary-content {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
}
</style>
