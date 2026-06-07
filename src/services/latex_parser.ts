/**
 * LaTeX 解析器
 * 提取和转换 LaTeX 标记
 */

/** 提取 $...$ 和 $$...$$ 包裹的 LaTeX 公式 */
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

/** 将 LaTeX 标记转为可渲染格式（mp-html 兼容） */
export function wrapForRender(content: string): string {
  // 将 $$...$$ 转为块级公式标记
  let result = content.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="latex-block">$$1$$</div>')

  // 将 $...$ 转为行内公式标记
  result = result.replace(/(?<!\$)\$(?!\$)(.*?)\$(?!\$)/g, '<span class="latex-inline">$1</span>')

  return result
}
