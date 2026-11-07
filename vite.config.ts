/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A relative base makes the build work unchanged at https://<user>.github.io/ and at
// https://<user>.github.io/<repo>/. Routing is hash-based, so the document path never changes.
// BASE_PATH can override this (e.g. "/Games/") when absolute asset URLs are preferred.
const base = process.env.BASE_PATH ?? './';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
  },
  worker: {
    format: 'es',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'tests/platform/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    restoreMocks: true,
    // Contract suites play whole games; under a full parallel run some take longer than 5 s.
    testTimeout: 20_000,
  },
});
