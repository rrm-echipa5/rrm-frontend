/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `true` pornește stratul mock (MSW) în locul backend-ului local (`npm run dev:mock`). */
  readonly VITE_API_MOCKS?: string;
  /** Momentul folosit de datele mock, în format ISO 8601; implicit, ora curentă. */
  readonly VITE_MOCK_NOW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
