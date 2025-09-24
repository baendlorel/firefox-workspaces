// @ts-check
import { defineConfig } from 'vite';
import { resolve } from 'path';

import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { replaceOpts, replaceLiteralOpts } from './scripts/replace.mjs';

const tsconfig = './tsconfig.build.json';

export default defineConfig({
  plugins: [
    replace(replaceOpts),
    replace({
      preventAssignment: true,
      delimiters: ['', ''],
      values: replaceLiteralOpts,
    }),
    typescript({ tsconfig }),
    {
      name: 'serve-popup-as-index',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            req.url = '/popup.html';
          }
          next();
        });
      },
    },
  ],
  build: {
    outDir: 'dist',
    minify: false,
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
