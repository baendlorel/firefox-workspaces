// @ts-check
import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';
import { replaceOpts, replaceLiteralOpts } from './scripts/replace.mjs';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    replace(replaceOpts),
    replace({
      delimiters: ['', ''],
      values: replaceLiteralOpts,
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: resolve('src/background.ts'),
        content: resolve('src/content.ts'),
        popup: resolve('src/popup.ts'),
        manager: resolve('src/manager.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
      },
    },
    // Clear dist directory before build
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve('src'),
    },
  },
});
