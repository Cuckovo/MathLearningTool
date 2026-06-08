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

const emit = defineEmits<{
  (e: 'ready'): void
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const geogebraStore = useGeogebraStore()

/**
 * iframeLoaded: iframe 的 load 事件已触发（DOM 已挂载）
 * ggbReady: GeoGebra Applet 内部初始化完成，可响应 evalCommand
 *
 * 关键：Tab 切换后 iframe 会重新加载，两个状态都需要重置
 * 由 geo_tool/index.vue 的 onShow 调用 resetState() 完成重置
 */
const iframeLoaded = ref<boolean>(false)
const ggbReady = ref<boolean>(false)

// 日志前缀
const LOG_PREFIX = '[GeoGebraWebView]'

// 从环境变量读取 GeoGebra 服务器地址
const baseUrl = getConfig('geogebraServerUrl')
console.log(`${LOG_PREFIX} GeoGebra 服务器地址：`, baseUrl)

/** iframe src（不带表达式，仅加载页面；表达式通过 postMessage 发送） */
const geogebraSrc = computed<string>(() => {
  return baseUrl
})

/** 带表达式参数的 URL（小程序端，走 URL 参数） */
const geogebraUrlWithExpr = computed<string>(() => {
  if (!props.expression) return baseUrl
  const sep = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${sep}expr=${encodeURIComponent(props.expression)}`
})

/**
 * 重置就绪状态（由父页面在 onShow 时调用）
 * Tab 切走后 iframe 会重新渲染，必须清除旧的就绪标记
 * 否则 watch 会误判 ggbReady=true 并提前 sendPlotCommand
 */
function resetState(): void {
  console.log(`${LOG_PREFIX} resetState 调用：重置 iframeLoaded/ggbReady`)
  iframeLoaded.value = false
  ggbReady.value = false
}

/** 监听来自 GeoGebra iframe 的消息 */
function setupMessageListener(): void {
  window.removeEventListener('message', messageHandler)
  window.addEventListener('message', messageHandler)
  console.log(`${LOG_PREFIX} 消息监听器已设置`)
}

/**
 * 消息处理函数
 * ggbReady 是绘图的"最终触发点"：
 * - 此时 contentWindow 一定可用
 * - pendingExpression 是此刻唯一可信数据源（props.expression 可能已被清空）
 */
function messageHandler(event: MessageEvent): void {
  if (event.data && event.data.type === 'ggbReady') {
    console.log(`${LOG_PREFIX} 收到 iframe 的 ggbReady 消息`)
    ggbReady.value = true
    iframeLoaded.value = true

    // 从 store 取表达式（watch 中不再调用 clearPending，表达式仍在 store 中）
    const exprToPlot = geogebraStore.pendingExpression
    if (exprToPlot) {
      console.log(`${LOG_PREFIX} GeoGebra 就绪，发送待绘制表达式：`, exprToPlot)
      // 延迟 300ms 确保 GeoGebra 内部渲染稳定
      setTimeout(() => {
        sendPlotCommand(exprToPlot)
        geogebraStore.clearPending()
        console.log(`${LOG_PREFIX} 绘图命令已发送，pendingExpression 已清空`)
      }, 300)
    } else {
      console.log(`${LOG_PREFIX} GeoGebra 就绪，无待绘制表达式`)
    }
  }
}

/** iframe 的 onLoad 事件（iframe DOM 挂载完成，GeoGebra 可能尚未就绪） */
function onIframeLoad(): void {
  console.log(`${LOG_PREFIX} iframe load 事件触发（GeoGebra applet 可能尚未就绪）`)
  iframeLoaded.value = true
  // ⚠️ 不在此处发送绘图命令！等待 ggbReady 消息
}

/** 向 iframe 发送绘图命令（仅在 ggbReady=true 时调用） */
function sendPlotCommand(expr: string): void {
  console.log(`${LOG_PREFIX} sendPlotCommand：`, expr)
  // #ifdef H5
  if (iframeRef.value && iframeRef.value.contentWindow) {
    iframeRef.value.contentWindow.postMessage(
      { type: 'plotFunction', expression: expr },
      '*',
    )
    console.log(`${LOG_PREFIX} postMessage 已发送`)
  } else {
    console.warn(`${LOG_PREFIX} 无法发送 postMessage：iframe 或 contentWindow 为空`)
  }
  // #endif
}

/**
 * 监听表达式变化
 * 策略：
 * - 如果 ggbReady=true（GeoGebra 已就绪），直接发送并清空 store
 * - 如果 ggbReady=false（等待加载），什么都不做，由 messageHandler 在 ggbReady 时处理
 *   ⚠️ 绝对不能在 ggbReady=false 时调用 clearPending，否则表达式会丢失
 */
watch(
  () => props.expression,
  (newExpr, oldExpr) => {
    console.log(`${LOG_PREFIX} 表达式变更：`, { oldExpr, newExpr })
    if (!newExpr || newExpr === oldExpr) {
      if (!newExpr) console.log(`${LOG_PREFIX} 表达式已清空`)
      return
    }

    if (ggbReady.value) {
      // GeoGebra 已就绪，直接发送
      console.log(`${LOG_PREFIX} GeoGebra 已就绪，直接发送绘图命令`)
      sendPlotCommand(newExpr)
      geogebraStore.clearPending()
    } else {
      // GeoGebra 未就绪，表达式保留在 store，等 ggbReady 消息触发
      console.log(`${LOG_PREFIX} GeoGebra 未就绪，表达式已保留在 store，等待 ggbReady 消息`)
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

// 暴露 resetState 供父页面调用
defineExpose({ resetState })
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
