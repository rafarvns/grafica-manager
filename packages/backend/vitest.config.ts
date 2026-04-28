import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@grafica/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
