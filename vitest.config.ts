import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // setupFiles: ['./src/macros.ts'],
    include: ['**/*.{test,spec,e2e-spec}.?(c|m)[jt]s?(x)'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@tests': path.resolve(import.meta.dirname, 'tests'),
    },
  },
});
