/**
 * GeoGebra 状态管理
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

const LOG_PREFIX = '[GeoGebraStore]'

export const useGeogebraStore = defineStore('geogebra', () => {
  /** 待渲染的函数表达式 */
  const pendingExpression = ref<string>('')
  /** 是否正在渲染 */
  const isRendering = ref<boolean>(false)

  /** 设置待渲染表达式 */
  function setPending(expr: string): void {
    console.log(`${LOG_PREFIX} setPending 调用，表达式：`, expr)
    pendingExpression.value = expr
    isRendering.value = true
    console.log(`${LOG_PREFIX} 状态已更新：`, { pendingExpression: pendingExpression.value, isRendering: isRendering.value })
  }

  /** 清除待渲染表达式 */
  function clearPending(): void {
    console.log(`${LOG_PREFIX} clearPending 调用`)
    pendingExpression.value = ''
    isRendering.value = false
    console.log(`${LOG_PREFIX} 状态已清除：`, { pendingExpression: pendingExpression.value, isRendering: isRendering.value })
  }

  return {
    pendingExpression,
    isRendering,
    setPending,
    clearPending,
  }
})
