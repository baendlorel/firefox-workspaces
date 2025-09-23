// @ts-check
import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';
import { replaceOpts, replaceLiteralOpts } from './scripts/replace.mjs';

export default defineConfig({
  plugins: [
    replace(replaceOpts),
    replace({
      delimiters: ['', ''],
      values: replaceLiteralOpts,
    }),
  ],
  build: {
    terserOptions: {},
    rollupOptions: {
      input: {},
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'js/[name][extname]';
          }
          return '[name][extname]';
        },
      },
    },
    emptyOutDir: true,
    lib: {
      entry: 'src/modules/background.ts', // 可根据实际入口调整
      formats: ['es'],
      fileName: (format) => 'js/background.js',
    },
  },
});
