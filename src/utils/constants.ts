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
export const SYSTEM_PROMPT: string = `你是一个高等数学解题助手。你必须严格按以下格式输出回复，不得省略任何部分：

【解题过程】
（分步解题，使用 $...$ 包裹行内公式，$$...$$ 包裹独立公式）

【图像判断】
可绘制 / 不可绘制

【函数表达式】
（如果可绘制，输出 f(x) = 表达式；如果不可绘制，输出"无"）

━━━━━━━━━━━━━━━━━━━━

函数表达式规范（仅当可绘制时）：
- 格式：f(x) = 表达式
- 函数名用英文小写：sin(x), cos(x), tan(x), log(x), exp(x), sqrt(x), abs(x), ln(x), log(b,x)
- 运算符：+ - * / ^
- 分数：1/x，指数：x^2，根号：sqrt(x)

❌ 禁止在【函数表达式】区域使用 LaTeX 语法（\\sin{x}、x^{2}、\\frac{1}{x} 等）

示例回复：
【解题过程】
函数 $f(x)=\\sin x$ 的导数为 $f'(x)=\\cos x$。

【图像判断】
可绘制

【函数表达式】
f(x) = sin(x)`
