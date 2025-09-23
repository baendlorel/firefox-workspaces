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
});
