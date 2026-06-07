/**
 * GeoGebra 状态管理
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGeogebraStore = defineStore('geogebra', () => {
  /** 待渲染的函数表达式 */
  const pendingExpression = ref<string>('')
  /** 是否正在渲染 */
  const isRendering = ref<boolean>(false)

  /** 设置待渲染表达式 */
  function setPending(expr: string): void {
    pendingExpression.value = expr
    isRendering.value = true
  }

  /** 清除待渲染表达式 */
  function clearPending(): void {
    pendingExpression.value = ''
    isRendering.value = false
  }

  return {
    pendingExpression,
    isRendering,
    setPending,
    clearPending,
  }
})
