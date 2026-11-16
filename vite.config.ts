/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { msw } from 'msw/vite';
import { defineConfig } from 'vite';

// Backend-ul FastAPI local (rrm-backend); se poate schimba cu variabila RRM_API_TARGET.
const apiTarget = process.env.RRM_API_TARGET ?? 'http://localhost:8080';

export default defineConfig({
  // msw() servește worker-ul MSW în dezvoltare; în build intră doar dacă e folosit (nu e).
  plugins: [react(), msw()],
  server: {
    port: 5173,
    // Cererile către /api ajung la backend-ul local, deci în dezvoltare nu e nevoie de CORS.
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
  },
});
