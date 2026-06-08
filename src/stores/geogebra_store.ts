/**
 * GeoGebra 状态管理
 *
 * 设计原则：表达式永久保留，新值覆盖旧值，不主动清空。
 * GeoGebra 每次就绪时直接读取当前 currentExpression 绘图。
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

const LOG_PREFIX = '[GeoGebraStore]'

export const useGeogebraStore = defineStore('geogebra', () => {
  /**
   * 当前函数表达式（持久保留，新值覆盖旧值）
   * - 初始为空字符串，表示尚无表达式
   * - AI 每次输出新表达式时调用 setExpression() 覆盖
   * - GeoGebra 就绪时直接读此值绘图
   */
  const currentExpression = ref<string>('')

  /** 设置（覆盖）当前函数表达式 */
  function setExpression(expr: string): void {
    console.log(`${LOG_PREFIX} setExpression 调用，新表达式：`, expr)
    const oldExpr = currentExpression.value
    currentExpression.value = expr
    console.log(`${LOG_PREFIX} 表达式已更新：`, { 旧值: oldExpr, 新值: expr })
  }

  /** 当前显示的视图：'chat' = AI对话页，'geo' = GeoGebra页（默认进入GeoGebra） */
  const activeView = ref<'chat' | 'geo'>('geo')

  /** 切换视图（不卸载页面，v-show 控制显隐） */
  function switchView(view: 'chat' | 'geo'): void {
    console.log(`${LOG_PREFIX} 切换视图：`, view)
    activeView.value = view
  }

  return {
    currentExpression,
    setExpression,
    activeView,
    switchView,
    // ── 向下兼容别名（chat_store / 其他地方仍使用旧名） ──
    get pendingExpression() { return currentExpression },
    setPending: setExpression,
  }
})
