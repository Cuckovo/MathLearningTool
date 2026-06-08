<template>
  <view class="geo-tool-page">
    <!-- 顶部导航栏 -->
    <view class="geo-navbar">
      <page-switcher current-page="geo" />
    </view>

    <!-- GeoGebra WebView 展示区 -->
    <view class="geogebra-container">
      <geogebra-webview ref="geoWebviewRef" :expression="pendingExpression" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import { useGeogebraStore } from '../../stores/geogebra_store'
import GeogebraWebview from '../../components/geogebra_webview.vue'
import PageSwitcher from '../../components/page_switcher.vue'

const LOG_PREFIX = '[GeoToolPage]'
const geogebraStore = useGeogebraStore()
const pendingExpression = computed(() => geogebraStore.pendingExpression)

// 持有 webview 组件引用，用于调用 resetState()
const geoWebviewRef = ref<InstanceType<typeof GeogebraWebview> | null>(null)

onMounted(() => {
  console.log(`${LOG_PREFIX} 页面已挂载`)
  console.log(`${LOG_PREFIX} 当前 pendingExpression：`, pendingExpression.value)
})

onShow(() => {
  console.log(`${LOG_PREFIX} 页面显示（Tab 切换至此页）`)

  /**
   * ⭐ 关键修复：重置 webview 就绪状态
   * Tab 切换后 iframe 会重新加载，ggbReady/iframeLoaded 必须清零
   * 否则 watch 会误判已就绪并提前发送绘图命令（此时 contentWindow 尚为 null）
   */
  if (geoWebviewRef.value) {
    console.log(`${LOG_PREFIX} 重置 GeoGebraWebview 就绪状态`)
    geoWebviewRef.value.resetState()
  }

  console.log(`${LOG_PREFIX} 当前 pendingExpression：`, pendingExpression.value)
  if (geogebraStore.pendingExpression) {
    console.log(`${LOG_PREFIX} 发现待渲染表达式：`, geogebraStore.pendingExpression)
    console.log(`${LOG_PREFIX} 等待 GeoGebra Applet 就绪后自动发送`)
  } else {
    console.log(`${LOG_PREFIX} 无待渲染表达式`)
  }
})

onHide(() => {
  console.log(`${LOG_PREFIX} 页面隐藏（Tab 切离）`)
  console.log(`${LOG_PREFIX} 保留状态，pendingExpression：`, pendingExpression.value)
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

.geogebra-container {
  flex: 1;
  overflow: hidden;
}
</style>
