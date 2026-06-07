/**
 * AI 响应解析器
 * 从 AI 原始输出中提取解题过程、图像判断、函数表达式
 */

import type { ParsedAiResponse } from '../types'

/** 提取【解题过程】内容 */
function extractSolvingProcess(content: string): string {
  const match = content.match(/【解题过程】\s*([\s\S]*?)(?=【图像判断】|$)/)
  return match ? match[1].trim() : content.trim()
}

/** 提取【图像判断】内容 */
function extractImageJudgment(content: string): string {
  const match = content.match(/【图像判断】\s*([\s\S]*?)(?=【函数表达式】|$)/)
  return match ? match[1].trim() : ''
}

/** 提取【函数表达式】，去除 "y = " 前缀 */
function extractFunctionExpression(content: string): string {
  const match = content.match(/【函数表达式】\s*([\s\S]*?)$/)
  if (!match) return ''

  let expr = match[1].trim()
  // 去除 "无" 等不可绘制标记
  if (expr === '无' || expr === '' || expr.toLowerCase() === 'none') {
    return ''
  }

  // 去除 "y = " / "y=" 前缀
  expr = expr.replace(/^y\s*=\s*/i, '')

  return expr
}

/** 解析 AI 原始响应内容 */
export function parse(rawContent: string): ParsedAiResponse {
  try {
    const solvingProcess = extractSolvingProcess(rawContent)
    const imageJudgment = extractImageJudgment(rawContent)
    const functionExpr = extractFunctionExpression(rawContent)

    // 判断是否可绘制：图像判断包含"可绘制"且表达式非空
    const canPlot = imageJudgment.includes('可绘制') && functionExpr !== ''

    return {
      solvingProcess,
      imageJudgment,
      functionExpr,
      canPlot,
    }
  } catch (error) {
    console.warn('[AiResponseParser] 解析失败，静默降级:', error)
    return {
      solvingProcess: rawContent,
      imageJudgment: '',
      functionExpr: '',
      canPlot: false,
    }
  }
}
