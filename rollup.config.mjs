// @ts-check
import pkg from './package.json' with { type: 'json' };
import path from 'node:path';

// plugins
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import dts from 'rollup-plugin-dts';
import dtsMerger from 'rollup-plugin-dts-merger';

// custom plugins
import { replaceLiteralOpts, replaceOpts } from './scripts/plugins/replace.mjs';

// # common options

/**
 * build config
 */
const tsconfig = './tsconfig.build.json';

/**
 * @type {import('@rollup/plugin-alias').RollupAliasOptions}
 */
const aliasOpts = {
  entries: [{ find: /^@\//, replacement: path.resolve(import.meta.dirname, 'src') + '/' }],
};

// # main options

/**
 * @type {import('rollup').RollupOptions[]}
 */
const options = [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.mjs',
        format: 'esm',
        sourcemap: false,
      },
      {
        file: 'dist/index.cjs',
        format: 'commonjs',
        sourcemap: false,
      },
    ],

    plugins: [
      alias(aliasOpts),
      replace(replaceOpts),
      resolve(),
      commonjs(),
      typescript({ tsconfig }),
      babel({
        babelHelpers: 'bundled',
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        presets: [['@babel/preset-env', { targets: { node: '14' } }]],
        plugins: [
          [
            '@babel/plugin-proposal-decorators',
            {
              version: '2023-11',
            },
          ],
        ],
      }),
      terser({
        format: {
          comments: false, // remove comments
        },
        compress: {
          reduce_vars: true,
          drop_console: true,
          dead_code: true, // ✅ Safe: remove dead code
          evaluate: true, // ✅ Safe: evaluate constant expressions
        },
        mangle: {
          properties: {
            regex: /^_/, // only mangle properties starting with '_'
          },
        },
      }),
    ],
    external: [],
  },
];

/**
 * @type {import('rollup').RollupOptions}
 */
const declaration = {
  input: 'src/index.ts',
  output: [{ file: 'dist/index.d.ts', format: 'es' }],
  plugins: [
    alias(aliasOpts),
    replace(replaceOpts),
    dts({ tsconfig }),
    dtsMerger({ replace: replaceOpts, replaceLiteral: replaceLiteralOpts }),
  ],
};

/**
 * @type {'npm'|'rollup-plugin'|'vscode-extension'|'server'|'web'|'app'|'framework'}
 */
switch (pkg.purpose) {
  case 'npm':
  case 'rollup-plugin':
    options.push(declaration);
    break;
}

export default options;
