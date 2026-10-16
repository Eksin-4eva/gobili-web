/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client-react" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CHAT_BASE_URL?: string;
  readonly VITE_CHAT_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
