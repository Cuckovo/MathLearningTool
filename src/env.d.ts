/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEOGEBRA_SERVER_URL: string
  readonly VITE_DEEPSEEK_API_BASE_URL: string
  readonly VITE_DEEPSEEK_MODEL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_STORAGE_KEY_PREFIX: string
  readonly VITE_MAX_CHAT_COUNT: string
  readonly VITE_MAX_MESSAGES_PER_CHAT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
