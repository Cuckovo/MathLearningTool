/**
 * 常量定义：存储 key 前缀、默认值等
 */

import { getConfig } from './env_config'

/** 存储 key 前缀，从环境变量读取 */
export const STORAGE_KEY_PREFIX: string = getConfig('storageKeyPrefix')

/** API Key 存储 key */
export const STORAGE_KEY_API_KEY: string = `${STORAGE_KEY_PREFIX}api_key`

/** 聊天列表索引 key */
export const STORAGE_KEY_CHAT_LIST: string = `${STORAGE_KEY_PREFIX}chat_list`

/** 单条聊天 key 前缀 */
export const STORAGE_KEY_CHAT_PREFIX: string = `${STORAGE_KEY_PREFIX}chat_`

/** 最大对话数量 */
export const MAX_CHAT_COUNT: number = getConfig('maxChatCount')

/** 每个对话最大消息数 */
export const MAX_MESSAGES_PER_CHAT: number = getConfig('maxMessagesPerChat')

/** 默认会话标题 */
export const DEFAULT_CHAT_TITLE: string = '新对话'

/** 系统提示词 */
export const SYSTEM_PROMPT: string = `你是一个高等数学解题助手。你的任务是：
1. 解答用户提出的高等数学问题，输出完整的解题过程
2. 判断该问题是否涉及可绘制的函数图像
3. 如果涉及函数图像，输出标准函数表达式

输出格式要求：
- 使用 LaTeX 语法书写数学公式，用 $...$ 包裹行内公式，用 $$...$$ 包裹独立公式
- 解题过程需清晰分步，每步标注所用定理或方法

输出结构：
【解题过程】
（分步解题，含 LaTeX 公式）

【图像判断】
可绘制 / 不可绘制

【函数表达式】
（如果可绘制，输出如 y = f(x) 的标准表达式；如果不可绘制，输出"无"）`
