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
  console.log(`${LOG_PREFIX} 页面已挂载`)
  console.log(`${LOG_PREFIX} 当前 pendingExpression：`, pendingExpression.value)
})

onShow(() => {
  console.log(`${LOG_PREFIX} 页面显示（Tab 切换至此页）`)
  console.log(`${LOG_PREFIX} 当前 pendingExpression：`, pendingExpression.value)
  
  // 检测待渲染函数（从 AI 对话页发送过来）
  if (geogebraStore.pendingExpression) {
    console.log(`${LOG_PREFIX} 发现待渲染表达式：`, geogebraStore.pendingExpression)
    // 表达式已通过 prop 传递给 webview，等待渲染
  } else {
    console.log(`${LOG_PREFIX} 无待渲染表达式`)
  }
})

onHide(() => {
  console.log(`${LOG_PREFIX} 页面隐藏（Tab 切离）`)
  console.log(`${LOG_PREFIX} 保留状态，pendingExpression：`, pendingExpression.value)
  // 不清除 pendingExpression，保留状态
})

onUnmounted(() => {
  console.log(`${LOG_PREFIX} 页面已卸载（tabBar 模式不应触发）`)
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
