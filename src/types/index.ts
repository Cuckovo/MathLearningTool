/**
 * 全局类型定义
 */

/** 单条聊天消息 */
export interface ChatMessage {
  /** 角色：user / assistant / system */
  role: 'user' | 'assistant' | 'system'
  /** 消息文本内容 */
  content: string
  /** 时间戳（毫秒） */
  timestamp: number
  /** 提取的 LaTeX 公式列表 */
  latex?: string[]
  /** 是否包含可绘制函数 */
  hasFunction?: boolean
  /** 函数表达式（纯表达式，已去除 "y = " 前缀） */
  functionExpr?: string
  /** 消息摘要 */
  summary?: string
}

/** 单个聊天会话 */
export interface ChatSession {
  /** 会话唯一 ID */
  id: string
  /** 会话标题 */
  title: string
  /** 消息列表 */
  messages: ChatMessage[]
  /** 创建时间（毫秒） */
  createdAt: number
  /** 最后更新时间（毫秒） */
  updatedAt: number
}

/** AI 响应解析结果 */
export interface ParsedAiResponse {
  /** 解题过程 */
  solvingProcess: string
  /** 图像判断结果 */
  imageJudgment: string
  /** 函数表达式 */
  functionExpr: string
  /** 是否可绘制 */
  canPlot: boolean
}

/** 聊天列表条目 */
export interface ChatListItem {
  /** 会话 ID */
  id: string
  /** 会话标题 */
  title: string
  /** 最后更新时间（毫秒） */
  updatedAt: number
}
