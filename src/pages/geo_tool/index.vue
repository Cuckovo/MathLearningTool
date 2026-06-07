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
import { computed, onMounted, onUnmounted } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import { useGeogebraStore } from '../../stores/geogebra_store'
import GeogebraWebview from '../../components/geogebra_webview.vue'

const LOG_PREFIX = '[GeoToolPage]'
const geogebraStore = useGeogebraStore()
const pendingExpression = computed(() => geogebraStore.pendingExpression)

onMounted(() => {
  console.log(`${LOG_PREFIX} Page mounted`)
  console.log(`${LOG_PREFIX} Current pendingExpression:`, pendingExpression.value)
})

onShow(() => {
  console.log(`${LOG_PREFIX} Page shown (tab switched to this page)`)
  console.log(`${LOG_PREFIX} Current pendingExpression:`, pendingExpression.value)
  
  // 检测待渲染函数（从 AI 对话页发送过来）
  if (geogebraStore.pendingExpression) {
    console.log(`${LOG_PREFIX} Found pending expression:`, geogebraStore.pendingExpression)
    // 表达式已通过 prop 传递给 webview，等待渲染
  } else {
    console.log(`${LOG_PREFIX} No pending expression`)
  }
})

onHide(() => {
  console.log(`${LOG_PREFIX} Page hidden (tab switched away)`)
  console.log(`${LOG_PREFIX} Preserving state, pendingExpression:`, pendingExpression.value)
  // 不清除 pendingExpression，保留状态
})

onUnmounted(() => {
  console.log(`${LOG_PREFIX} Page unmounted (should not happen with tabBar)`)
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
