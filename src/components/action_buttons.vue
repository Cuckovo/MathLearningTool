<template>
  <view class="action-buttons">
    <button
      class="action-btn"
      :class="{ 'action-btn--disabled': !canSummarize }"
      :disabled="!canSummarize"
      @tap="handleSummary"
    >
      <text>📝</text>
      <text>总结</text>
    </button>
    <button
      class="action-btn"
      :class="{ 'action-btn--disabled': !canPlot }"
      :disabled="!canPlot"
      @tap="handleSendToGeoGebra"
    >
      <text>📈</text>
      <text>发送到 GeoGebra</text>
    </button>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  canSummarize: boolean
  canPlot: boolean
}>()

const emit = defineEmits<{
  (e: 'summary'): void
  (e: 'send-to-geo-gebra'): void
}>()

function handleSummary(): void {
  emit('summary')
}

function handleSendToGeoGebra(): void {
  emit('send-to-geo-gebra')
}
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-surface);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: 0.18s ease;
  border: 1px solid var(--color-border-brand);
  background: var(--color-bg-surface);
  color: var(--color-primary);
  line-height: 1.4;
}

.action-btn:active {
  background: var(--color-primary-soft);
}

.action-btn--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--color-border-default);
  color: var(--color-text-disabled);
  background: var(--color-bg-page);
}

.action-btn--disabled:active {
  background: var(--color-bg-page);
}
</style>
