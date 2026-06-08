<template>
  <view class="geogebra-webview">
    <!-- H5 端使用 iframe -->
    <!-- #ifdef H5 -->
    <iframe
      ref="iframeRef"
      :src="geogebraSrc"
      class="geogebra-iframe"
      frameborder="0"
      allowfullscreen
      @load="onIframeLoad"
    ></iframe>
    <!-- #endif -->

    <!-- 小程序端使用 web-view -->
    <!-- #ifndef H5 -->
    <web-view :src="geogebraUrlWithExpr"></web-view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getConfig } from '../utils/env_config'
import { useGeogebraStore } from '../stores/geogebra_store'

const props = defineProps<{
  expression: string
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const geogebraStore = useGeogebraStore()
const iframeLoaded = ref<boolean>(false)
const ggbReady = ref<boolean>(false) // 跟踪 GeoGebra applet 是否就绪

// 日志前缀
const LOG_PREFIX = '[GeoGebraWebView]'

// 从环境变量读取 GeoGebra 服务器地址
const baseUrl = getConfig('geogebraServerUrl')
console.log(`${LOG_PREFIX} GeoGebra 服务器地址：`, baseUrl)

/** iframe src：若有待渲染表达式，附加 URL 参数 */
const geogebraSrc = computed<string>(() => {
  console.log(`${LOG_PREFIX} 计算 geogebraSrc，表达式：`, props.expression)
  if (!props.expression) return baseUrl
  const sep = baseUrl.includes('?') ? '&' : '?'
  const url = `${baseUrl}${sep}expr=${encodeURIComponent(props.expression)}`
  console.log(`${LOG_PREFIX} geogebraSrc：`, url)
  return url
})

/** 带表达式参数的 URL（小程序端） */
const geogebraUrlWithExpr = computed<string>(() => {
  if (!props.expression) return baseUrl
  const sep = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${sep}expr=${encodeURIComponent(props.expression)}`
})

/** 组件挂载 */
onMounted(() => {
  console.log(`${LOG_PREFIX} 组件已挂载`)
})

/** 组件卸载 */
onUnmounted(() => {
  console.log(`${LOG_PREFIX} 组件已卸载`)
})

/** 监听来自 GeoGebra iframe 的消息 */
function setupMessageListener(): void {
  // 避免重复添加监听器
  window.removeEventListener('message', messageHandler)
  
  window.addEventListener('message', messageHandler)
  console.log(`${LOG_PREFIX} 消息监听器已设置`)
}

/** 消息处理函数 */
function messageHandler(event: MessageEvent): void {
  if (event.data && event.data.type === 'ggbReady') {
    console.log(`${LOG_PREFIX} 收到 iframe 的 ggbReady 消息`)
    ggbReady.value = true
    iframeLoaded.value = true

    // ⭐ 修复：以 store 中的 pendingExpression 为唯一数据源，避免 props 被清空后取不到值
    const exprToPlot = geogebraStore.pendingExpression || props.expression
    if (exprToPlot) {
      console.log(`${LOG_PREFIX} GeoGebra 已就绪，发送待渲染表达式：`, exprToPlot)
      setTimeout(() => {
        sendPlotCommand(exprToPlot)
        // 绘制成功后清空 store
        geogebraStore.clearPending()
      }, 500)
    }
  }
}

/** iframe 加载完成 */
function onIframeLoad(): void {
  console.log(`${LOG_PREFIX} iframe 已加载`)
  iframeLoaded.value = true

  // iframe 加载完成后，如果 GeoGebra 已就绪且有表达式，发送绘图命令
  // ⭐ 以 store 中的 pendingExpression 为唯一数据源
  const exprToPlot = geogebraStore.pendingExpression || props.expression
  if (exprToPlot && ggbReady.value) {
    console.log(`${LOG_PREFIX} iframe 已加载（ggbReady），发送绘图命令：`, exprToPlot)
    setTimeout(() => {
      sendPlotCommand(exprToPlot)
      geogebraStore.clearPending()
    }, 500)
  }
}

/** 向 iframe 发送绘图命令 */
function sendPlotCommand(expr: string): void {
  console.log(`${LOG_PREFIX} 向 iframe 发送绘图命令，表达式：`, expr)
  
  // #ifdef H5
  if (iframeRef.value && iframeRef.value.contentWindow) {
    console.log(`${LOG_PREFIX} postMessage 已发送：`, { type: 'plotFunction', expression: expr })
    iframeRef.value.contentWindow.postMessage(
      { type: 'plotFunction', expression: expr },
      '*',
    )
  } else {
    console.warn(`${LOG_PREFIX} 无法发送 postMessage：iframe 或 contentWindow 为空`)
  }
  // #endif
}

/** 监听表达式变化：通过 postMessage 更新，而不是重建 iframe */
watch(
  () => props.expression,
  (newExpr, oldExpr) => {
    console.log(`${LOG_PREFIX} 表达式已变更：`, { oldExpr, newExpr })

    if (newExpr && newExpr !== oldExpr) {
      console.log(`${LOG_PREFIX} 检测到新表达式，发送至 GeoGebra：`, newExpr)
      // ⭐ 修复：不再调用 clearPending()，避免表达式在 iframe 加载前被清空
      // geogebraStore.clearPending() ← 已移除

      // 如果 iframe 已加载且 GeoGebra 已就绪，直接发送消息
      if (iframeLoaded.value && ggbReady.value) {
        console.log(`${LOG_PREFIX} GeoGebra 已就绪，直接发送绘图命令`)
        sendPlotCommand(newExpr)
        // 绘制成功后清空 store
        geogebraStore.clearPending()
      } else {
        console.log(`${LOG_PREFIX} GeoGebra 未就绪，将在 iframe 加载后发送`)
      }
    } else if (!newExpr) {
      console.log(`${LOG_PREFIX} 表达式已清除`)
    }
  },
)

onMounted(() => {
  console.log(`${LOG_PREFIX} 组件已挂载`)
  setupMessageListener()
})

onUnmounted(() => {
  console.log(`${LOG_PREFIX} 组件已卸载`)
  window.removeEventListener('message', messageHandler)
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
