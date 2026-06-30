// @ts-check
import { defineConfig } from 'vite';
import { resolve } from 'path';

import typescript from '@rollup/plugin-typescript';
import funcMacro from 'rollup-plugin-func-macro';

import { replace } from './scripts/replace.js';

const tsconfig = './tsconfig.build.json';

export default defineConfig({
  base: './',
  plugins: [typescript({ tsconfig }), replace(), funcMacro()],
  server: {
    open: 'pages/index.html',
  },
  build: {
    outDir: 'dist',
    minify: false,
    rollupOptions: {
      input: {
        // pages
        index: resolve('pages/index.html'),
        import: resolve('pages/import.html'),
        about: resolve('pages/about.html'),
        donate: resolve('pages/donate.html'),
        export: resolve('pages/export.html'),

        // js
        background: resolve('src/background.ts'),
        content: resolve('src/content.ts'),
        popup: resolve('src/web/popup.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
      },
    },
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@/': resolve('src') + '/',
      '@web/': resolve('src/web') + '/',
      '@assets/': resolve('src/web/assets') + '/',
      '@comp/': resolve('src/web/components') + '/',
    },
  },
});
