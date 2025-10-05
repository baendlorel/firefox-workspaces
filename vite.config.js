// @ts-check
import { defineConfig } from 'vite';
import { resolve } from 'path';

import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import funcMacro from 'rollup-plugin-func-macro';
import constEnum from 'rollup-plugin-const-enum';
import tailwindcss from '@tailwindcss/vite';
import tailwindcssPostcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

import { replaceOpts, replaceLiteralOpts } from './.scripts/replace.mjs';

const tsconfig = './tsconfig.build.json';

export default defineConfig({
  base: './',
  plugins: [
    typescript({ tsconfig }),
    constEnum(),
    replace({
      preventAssignment: false,
      delimiters: ['', ''],
      // & replace loggers
      values: { ...replaceLiteralOpts },
    }),
    replace(replaceOpts),
    funcMacro(),
    tailwindcss(),
  ],
  css: {
    postcss: {
      plugins: [autoprefixer, tailwindcssPostcss],
    },
  },
  server: {
    open: 'index.html',
  },
  build: {
    outDir: 'dist',
    minify: false,
    rollupOptions: {
      input: {
        index: resolve('index.html'),
        background: resolve('src/background.ts'),
        content: resolve('src/content.ts'),
        popup: resolve('src/web/popup.ts'),
        // manager: resolve('src/manager.ts'),
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
