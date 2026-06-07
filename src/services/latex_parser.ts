/**
 * LaTeX 解析器
 * 提取和渲染 LaTeX 标记（使用 KaTeX 引擎）
 */

import katex from 'katex'

/** HTML 转义 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 提取 $...$ 和 $$...$$ 包裹的 LaTeX 公式（用于元数据提取） */
export function extractLatex(content: string): string[] {
  const results: string[] = []

  // 提取 $$...$$ 独立公式（优先匹配，避免被 $...$ 误截断）
  const displayRegex = /\$\$([\s\S]*?)\$\$/g
  let match: RegExpExecArray | null
  while ((match = displayRegex.exec(content)) !== null) {
    results.push(match[1].trim())
  }

  // 提取 $...$ 行内公式（排除已匹配的 $$）
  const inlineRegex = /(?<!\$)\$(?!\$)(.*?)\$(?!\$)/g
  while ((match = inlineRegex.exec(content)) !== null) {
    results.push(match[1].trim())
  }

  return results
}

/**
 * 将含 LaTeX 标记的内容转为 KaTeX 渲染后的 HTML
 * - $$...$$ → 块级公式（display mode）
 * - $...$ → 行内公式（inline mode）
 */
export function wrapForRender(content: string): string {
  // 先处理 $$...$$ 块级公式，替换为 KaTeX 渲染的 HTML
  let result = content.replace(/\$\$([\s\S]*?)\$\$/g, (_full: string, expr: string) => {
    try {
      return katex.renderToString(expr.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
      })
    } catch {
      return `<div class="latex-block-fallback">${escapeHtml(expr.trim())}</div>`
    }
  })

  // 再处理 $...$ 行内公式
  result = result.replace(/(?<!\$)\$(?!\$)(.*?)\$(?!\$)/g, (_full: string, expr: string) => {
    try {
      return katex.renderToString(expr.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
      })
    } catch {
      return `<span class="latex-inline-fallback">${escapeHtml(expr.trim())}</span>`
    }
  })

  // 基础 Markdown → HTML 转换（加粗）
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  return result
}
