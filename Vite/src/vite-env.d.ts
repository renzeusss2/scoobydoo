/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_CONTRACT_ID: string;
  readonly VITE_TOKEN_ID: string;
  // add more env vars here as needed
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ✅ FIX: allow CSS imports in TypeScript
declare module "*.css";