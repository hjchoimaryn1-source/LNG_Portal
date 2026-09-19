import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mirrors tsconfig.json's "paths": { "@/*": ["./src/*"] } for the vitest/vite
// resolver, which does not read tsconfig `paths` on its own (unlike tsc and
// Next.js's webpack/turbopack resolution). No other test defaults are set here
// on purpose — the suite ran with zero vitest config before this file existed.
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
