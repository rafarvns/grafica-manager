import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const __dirname = new URL('.', import.meta.url).pathname;

export default defineConfig({
  plugins: [tsconfigPaths({ root: __dirname })],
  test: {
    globals: true,
    environment: 'node',
  },
});
