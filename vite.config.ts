/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Content-Security-Policy for the production build. GitHub Pages cannot send response headers,
 * so the policy ships as a <meta> tag. Everything is same-origin: no CDNs, no analytics, no
 * backend. Inline styles stay allowed for React style props and SVG markup. Only applied to
 * builds, because the dev server injects inline scripts for hot reload.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'arcade-content-security-policy',
    apply: 'build',
    // Right after <meta charset>, ahead of every script and stylesheet the policy governs.
    transformIndexHtml: (html) => {
      const charset = '<meta charset="UTF-8" />';
      if (!html.includes(charset))
        throw new Error('index.html must declare <meta charset="UTF-8" />');
      return html.replace(
        charset,
        `${charset}\n    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  // A relative base makes the build work unchanged at https://<user>.github.io/ and at
  // https://<user>.github.io/<repo>/. Routing is hash-based, so the document path never changes.
  // BASE_PATH (environment or .env, see .env.example) can override this, e.g. "/Games/".
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.BASE_PATH || './';

  return {
    base,
    plugins: [react(), contentSecurityPolicy()],
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
  };
});
