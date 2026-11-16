/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `true` pornește stratul mock (MSW) în locul backend-ului local (`npm run dev:mock`). */
  readonly VITE_API_MOCKS?: string;
  /** Id-ul utilizatorului din datele de test în numele căruia răspunde mock-ul (implicit 4). */
  readonly VITE_MOCK_USER_ID?: string;
  /** Momentul folosit de datele mock, în format ISO 8601; implicit, ora curentă. */
  readonly VITE_MOCK_NOW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
