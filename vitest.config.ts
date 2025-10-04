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
      '@assets': path.resolve(import.meta.dirname, 'src', 'web', 'assets'),
      '@comp': path.resolve(import.meta.dirname, 'src', 'web', 'components'),
      '@tests': path.resolve(import.meta.dirname, 'tests'),
    },
  },
});
