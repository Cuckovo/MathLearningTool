/**
 * 环境配置读取工具
 * 封装 import.meta.env 的读取，提供类型安全的访问
 */

interface EnvConfig {
  geogebraServerUrl: string
  deepseekApiBaseUrl: string
  deepseekModel: string
  deepseekDefaultApiKey: string
  appTitle: string
  storageKeyPrefix: string
  maxChatCount: number
  maxMessagesPerChat: number
}

/** 读取环境变量，带默认值 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  return (import.meta.env[key] as string) || defaultValue
}

/** 获取完整环境配置 */
export function getEnvConfig(): EnvConfig {
  return {
    geogebraServerUrl: getEnvVar('VITE_GEOGEBRA_SERVER_URL', 'http://localhost:8080/geogebra.html'),
    deepseekApiBaseUrl: getEnvVar('VITE_DEEPSEEK_API_BASE_URL', 'https://api.deepseek.com'),
    deepseekModel: getEnvVar('VITE_DEEPSEEK_MODEL', 'deepseek-chat'),
    deepseekDefaultApiKey: getEnvVar('VITE_DEEPSEEK_DEFAULT_API_KEY', ''),
    appTitle: getEnvVar('VITE_APP_TITLE', '高数函数图像解题工具'),
    storageKeyPrefix: getEnvVar('VITE_STORAGE_KEY_PREFIX', 'mlt_'),
    maxChatCount: parseInt(getEnvVar('VITE_MAX_CHAT_COUNT', '10'), 10),
    maxMessagesPerChat: parseInt(getEnvVar('VITE_MAX_MESSAGES_PER_CHAT', '100'), 10),
  }
}

/** 按字段名获取单个配置值 */
export function getConfig<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  return getEnvConfig()[key]
}
