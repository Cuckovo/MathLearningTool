<template>
  <view class="geo-tool-page">
    <!-- 顶部导航栏 -->
    <view class="geo-navbar">
      <text class="navbar-title">GeoGebra 工具</text>
    </view>

    <!-- GeoGebra WebView 展示区 -->
    <view class="geogebra-container">
      <geogebra-webview :expression="pendingExpression" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useGeogebraStore } from '../../stores/geogebra_store'
import GeogebraWebview from '../../components/geogebra_webview.vue'

const geogebraStore = useGeogebraStore()
const pendingExpression = computed(() => geogebraStore.pendingExpression)

onShow(() => {
  // 检测待渲染函数（从 AI 对话页发送过来）
  if (geogebraStore.pendingExpression) {
    // 表达式已通过 prop 传递给 webview，等待渲染
  }
})
</script>

<style scoped>
.geo-tool-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-page);
}

.geo-navbar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-soft);
  height: 48px;
}

.navbar-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.geogebra-container {
  flex: 1;
  overflow: hidden;
}
</style>
