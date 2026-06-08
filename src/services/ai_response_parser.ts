/**
 * AI 响应解析器
 * 从 AI 原始输出中提取解题过程、图像判断、函数表达式
 * 并将函数表达式从 LaTeX 格式转换为 GeoGebra 可用格式
 */

import type { ParsedAiResponse } from '../types'

const LOG_PREFIX = '[AIResponseParser]'

/** 提取【解题过程】内容 */
function extractSolvingProcess(content: string): string {
  console.log(`${LOG_PREFIX} extractSolvingProcess: input length=${content.length}`)
  const match = content.match(/【解题过程】\s*([\s\S]*?)(?=【图像判断】|$)/)
  const result = match ? match[1].trim() : content.trim()
  console.log(`${LOG_PREFIX} extractSolvingProcess: result length=${result.length}`)
  return result
}

/** 提取【图像判断】内容 */
function extractImageJudgment(content: string): string {
  console.log(`${LOG_PREFIX} extractImageJudgment: input length=${content.length}`)
  const match = content.match(/【图像判断】\s*([\s\S]*?)(?=【函数表达式】|$)/)
  const result = match ? match[1].trim() : ''
  console.log(`${LOG_PREFIX} extractImageJudgment: result=`, result)
  return result
}

/**
 * 将 LaTeX 表达式转为 GeoGebra 可识别的纯文本表达式
 * 例：\frac{2}{x} → (2)/(x)
 *     \sin x → sin(x)
 *     x^2 + y^2 → x^2 + y^2
 */
function latexToGeogebraExpr(latex: string): string {
  console.log(`${LOG_PREFIX} latexToGeogebraExpr: input=`, latex)
  let expr = latex.trim()

  // 1. 处理 \frac{a}{b} → (a)/(b)
  // 需要递归处理嵌套
  expr = expr.replace(/\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, '($1)/($2)')
  console.log(`${LOG_PREFIX} After frac processing:`, expr)

  // 2. 处理 \sqrt{a} → sqrt(a), \sqrt[n]{a} → nroot(n, a)
  expr = expr.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, 'nroot($1, $2)')
  expr = expr.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
  console.log(`${LOG_PREFIX} After sqrt processing:`, expr)

  // 3. 处理带花括号的标准函数: \sin{x} → sin(x), \log_{2}{x} → log(2, x)
  expr = expr.replace(/\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan)\{([^}]+)\}/g, '$1($2)')
  expr = expr.replace(/\\(log|ln)\{([^}]+)\}/g, '$1($2)')
  expr = expr.replace(/\\(log|ln)_\{([^}]+)\}\{([^}]+)\}/g, 'log($2, $3)')
  console.log(`${LOG_PREFIX} After trig/log processing:`, expr)

  // 4. 去掉下标的 _{} 标记（GeoGebra 用下标表示序列，不需要）
  expr = expr.replace(/_\{[^}]+\}/g, '')
  console.log(`${LOG_PREFIX} After subscript removal:`, expr)

  // 5. 去掉 ^ 的上标花括号（保留 ^ 但去花括号如果只有单个字符）
  expr = expr.replace(/\^\{([^{}]+)\}/g, '^($1)')
  console.log(`${LOG_PREFIX} After superscript processing:`, expr)

  // 6. 去掉剩余反斜杠命令
  expr = expr.replace(/\\(displaystyle|mathrm|mathbf|mathit|mathbb|mathcal|mathfrak|text|mbox|limits?|left|right|big|bigl|bigr|Big|Bigl|Bigr|bigg|Bigg)\b/g, '')
  expr = expr.replace(/\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|log|ln|exp|abs|det|lim|max|min|mod|gcd|lcm)\b/gi, '$1')
  expr = expr.replace(/\\([a-zA-Z]+)/g, '$1') // 去掉剩余的 LaTeX 命令
  console.log(`${LOG_PREFIX} After backslash removal:`, expr)

  // 6.5 处理 "sin x" 格式（函数名+空格+参数）→ 转为 "sin(x)"
  // AI 可能返回 sin x、cos 2x 等格式（无反斜杠、无花括号）
  expr = expr.replace(/\b(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan)\s+([a-zA-Z0-9_]+)/gi, '$1($2)')
  // 处理 log 2 x → log(2, x) 这种格式较复杂，暂不处理，只处理单参数
  console.log(`${LOG_PREFIX} After sin x → sin(x) processing:`, expr)

  // 7. 处理 \{ \} → 普通括号（LaTeX 转义花括号）
  expr = expr.replace(/\\\{/g, '{').replace(/\\\}/g, '}')
  console.log(`${LOG_PREFIX} After brace escape:`, expr)

  // 8. 清理多余花括号（平衡配对）
  expr = expr.replace(/^\{(.+)\}$/, '$1')
  console.log(`${LOG_PREFIX} After brace cleanup:`, expr)

  // 9. 清理空格、换行
  expr = expr.replace(/\s+/g, ' ').trim()
  console.log(`${LOG_PREFIX} latexToGeogebraExpr: final result=`, expr)

  return expr
}

/**
 * 清理中文说明和非数学文本
 * AI 可能在公式后追加描述，如 `$$\frac{1}{x}$$ （当 $x>0$ 时...）`
 */
function stripChineseDescription(rawExpr: string): string {
  let expr = rawExpr.trim()

  // 1. 去掉 $$...$$ 后面的所有内容（包括中文说明）
  // 匹配 $$formula$$ 或 $$formula$ 后跟随的任意内容，整行截取到 $$ 闭合处
  const doubleDollarMatch = expr.match(/^(.+?\$\$)/)
  if (doubleDollarMatch) {
    expr = doubleDollarMatch[1]
    console.log(`${LOG_PREFIX} After double-dollar strip:`, expr)
  }

  // 2. 去掉 $...$ 后面的所有内容（包括中文说明）
  // 匹配 $formula$ 后跟随的任意内容
  const singleDollarMatch = expr.match(/^(.+?\$)/)
  if (singleDollarMatch) {
    // 确保不是残留的开头 $ 符号
    const captured = singleDollarMatch[1]
    if (captured.length > 1 && captured.endsWith('$')) {
      expr = captured
      console.log(`${LOG_PREFIX} After single-dollar strip:`, expr)
    }
  }

  // 3. 去掉全角括号（中文说明）及其后面的所有内容
  // 匹配 （当...时...） 这类说明
  expr = expr.replace(/\uff08.*$/, '') // 全角左括号（
  expr = expr.replace(/\u3010.*$/, '') // 【
  expr = expr.replace(/\u201c.*$/, '') // "
  expr = expr.replace(/\u300c.*$/, '') // 「
  console.log(`${LOG_PREFIX} After Chinese desc strip:`, expr)

  // 4. 去掉末尾残留的 $ 符号
  expr = expr.replace(/\$+$/, '')
  expr = expr.replace(/^\$+/, '')

  // 5. 去掉末尾的换行和多余空格
  expr = expr.trim()

  return expr
}

/** 提取【函数表达式】，去除 LaTeX 标记并转为 GeoGebra 可用格式 */
function extractFunctionExpression(content: string): string {
  console.log(`${LOG_PREFIX} extractFunctionExpression: input length=${content.length}`)
  const match = content.match(/【函数表达式】\s*([\s\S]*?)$/)
  if (!match) {
    console.log(`${LOG_PREFIX} extractFunctionExpression: no match found`)
    return ''
  }

  let expr = match[1].trim()
  console.log(`${LOG_PREFIX} extractFunctionExpression: raw expr=`, expr)

  // 去除 "无" 等不可绘制标记
  if (expr === '无' || expr === '' || expr.toLowerCase() === 'none') {
    console.log(`${LOG_PREFIX} extractFunctionExpression: expression is empty or "无"`)
    return ''
  }

  // 去除 $$ / $ 包裹
  expr = expr.replace(/^\$\$\s*/, '').replace(/\s*\$\$[\s\S]*$/, '')
  expr = expr.replace(/^\$\s*/, '').replace(/\s*\$$/, '')
  console.log(`${LOG_PREFIX} After dollar sign removal:`, expr)

  // ⭐ 新增：去除中文说明和描述文本
  expr = stripChineseDescription(expr)
  console.log(`${LOG_PREFIX} After stripChineseDescription:`, expr)

  // 去除 "y = " / "y=" 前缀
  expr = expr.replace(/^y\s*=\s*/i, '')
  console.log(`${LOG_PREFIX} After "y=" removal:`, expr)

  // 转为 GeoGebra 可用格式
  expr = latexToGeogebraExpr(expr)
  console.log(`${LOG_PREFIX} extractFunctionExpression: final result=`, expr)

  return expr
}

/** 解析 AI 原始响应内容 */
export function parse(rawContent: string): ParsedAiResponse {
  console.log(`${LOG_PREFIX} parse: started, input length=${rawContent.length}`)
  try {
    const solvingProcess = extractSolvingProcess(rawContent)
    const imageJudgment = extractImageJudgment(rawContent)
    const functionExpr = extractFunctionExpression(rawContent)

    // 判断是否可绘制：排除"不可绘制"，且包含"可绘制"，且表达式非空
    const canPlot = !imageJudgment.includes('不可绘制') && imageJudgment.includes('可绘制') && functionExpr !== ''
    console.log(`${LOG_PREFIX} parse: result=`, { solvingProcessLength: solvingProcess.length, imageJudgment, functionExpr, canPlot })

    return {
      solvingProcess,
      imageJudgment,
      functionExpr,
      canPlot,
    }
  } catch (error) {
    console.warn(`${LOG_PREFIX} 解析失败，静默降级:`, error)
    return {
      solvingProcess: rawContent,
      imageJudgment: '',
      functionExpr: '',
      canPlot: false,
    }
  }
}
