/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENROUTER_API_KEY: string
  readonly VITE_WS_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_ERROR_REPORTING: string
  readonly VITE_ENABLE_BETA_FEATURES: string
  readonly VITE_DEV_MOCK_WEBSOCKET: string
  readonly VITE_DEV_VERBOSE_LOGGING: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}