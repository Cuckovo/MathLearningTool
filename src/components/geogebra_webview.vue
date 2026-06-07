<template>
  <view class="geogebra-webview">
    <!-- H5 端使用 iframe -->
    <!-- #ifdef H5 -->
    <iframe
      ref="iframeRef"
      :src="geogebraUrl"
      class="geogebra-iframe"
      frameborder="0"
      allowfullscreen
    ></iframe>
    <!-- #endif -->

    <!-- 小程序端使用 web-view -->
    <!-- #ifndef H5 -->
    <web-view :src="geogebraUrlWithExpr"></web-view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getConfig } from '../utils/env_config'
import { useGeogebraStore } from '../stores/geogebra_store'

const props = defineProps<{
  expression: string
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const geogebraStore = useGeogebraStore()
const geogebraUrl = getConfig('geogebraServerUrl')

/** 带表达式参数的 URL（小程序端使用） */
const geogebraUrlWithExpr = computed<string>(() => {
  if (!props.expression) return geogebraUrl
  const separator = geogebraUrl.includes('?') ? '&' : '?'
  return `${geogebraUrl}${separator}expr=${encodeURIComponent(props.expression)}`
})

/** 向 iframe 发送绘图命令（H5 端） */
function sendPlotCommand(expr: string): void {
  // #ifdef H5
  if (iframeRef.value && iframeRef.value.contentWindow) {
    iframeRef.value.contentWindow.postMessage(
      {
        type: 'plotFunction',
        expression: expr,
      },
      '*',
    )
  }
  // #endif
}

/** 监听表达式变化 */
watch(
  () => props.expression,
  (newExpr) => {
    if (newExpr) {
      sendPlotCommand(newExpr)
      geogebraStore.clearPending()
    }
  },
)

onMounted(() => {
  // 如果初始就有表达式，立即发送
  if (props.expression) {
    setTimeout(() => {
      sendPlotCommand(props.expression)
      geogebraStore.clearPending()
    }, 2000) // 等待 iframe 加载
  }
})
</script>

<style scoped>
.geogebra-webview {
  width: 100%;
  height: 100%;
}

.geogebra-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
