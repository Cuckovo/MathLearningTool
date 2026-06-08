<template>
  <view class="page-switcher">
    <view class="switcher-track">
      <view
        class="switcher-option"
        :class="{ active: activeView === 'geo' }"
        @tap="switchTo('geo')"
      >
        <text class="switcher-label">GeoGebra</text>
      </view>
      <view
        class="switcher-option"
        :class="{ active: activeView === 'chat' }"
        @tap="switchTo('chat')"
      >
        <text class="switcher-label">对话</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGeogebraStore } from '../stores/geogebra_store'

const geogebraStore = useGeogebraStore()
const activeView = computed(() => geogebraStore.activeView)

/** 切换视图（不卸载页面，v-show 控制显隐） */
function switchTo(view: 'chat' | 'geo'): void {
  geogebraStore.switchView(view)
}
</script>

<style scoped>
.page-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 椭圆胶囊容器 */
.switcher-track {
  display: flex;
  align-items: center;
  background: var(--color-bg-page, #f2f2f2);
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
}

/* 单个选项 */
.switcher-option {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 18px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.25s ease;
}

/* 选中状态：品牌绿色背景 + 白色文字 */
.switcher-option.active {
  background: var(--color-brand, #90c208);
  box-shadow: 0 1px 3px rgba(144, 194, 8, 0.25);
}

.switcher-option.active .switcher-label {
  color: #fff;
  font-weight: 600;
}

/* 未选中（灰度）状态 */
.switcher-option:not(.active) .switcher-label {
  color: var(--color-text-tertiary, rgba(34, 34, 34, 0.5));
  font-weight: 400;
}

.switcher-label {
  font-size: 14px;
  white-space: nowrap;
  line-height: 1;
}
</style>
