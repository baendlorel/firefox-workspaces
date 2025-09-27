// @ts-check
import { defineConfig } from 'vite';
import { resolve } from 'path';

import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import funcMacro from 'rollup-plugin-func-macro';

import { replaceOpts, replaceLiteralOpts } from './.scripts/replace.mjs';
import staticCopy from './.scripts/static-copy.mjs';

const tsconfig = './tsconfig.build.json';

export default defineConfig({
  plugins: [
    typescript({ tsconfig }),
    funcMacro(),
    replace(replaceOpts),
    replace({
      preventAssignment: true,
      delimiters: ['', ''],
      values: replaceLiteralOpts,
    }),
    staticCopy({
      map: {
        'src/icons': 'dist/icons',
      },
    }),
  ],
  server: {
    open: 'public/popup.html',
  },
  build: {
    outDir: 'dist',
    minify: false,
    rollupOptions: {
      input: {
        index: resolve('public/popup.html'),
        background: resolve('src/background.ts'),
        content: resolve('src/content.ts'),
        popup: resolve('src/web/popup.ts'),
        manager: resolve('src/manager.ts'),
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
    },
  },
});
