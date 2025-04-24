/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VERCEL_PREVIEW_BYPASS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
