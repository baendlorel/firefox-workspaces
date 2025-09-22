// @ts-check
import pkg from '../../package.json' with { type: 'json' };

function formatDateFull(dt = new Date()) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  const ss = String(dt.getSeconds()).padStart(2, '0');
  const ms = String(dt.getMilliseconds()).padStart(3, '0');
  return `${y}.${m}.${d} ${hh}:${mm}:${ss}.${ms}`;
}

const __KEBAB_NAME__ = (process.env.KSKB_TSUMUGI_REAL_NAME ?? '').replace('rollup-plugin-', '');
const __NAME__ = __KEBAB_NAME__.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());

const __PKG_INFO__ = `## About
 * @package ${__NAME__}
 * @author ${pkg.author.name} <${pkg.author.email}>
 * @version ${pkg.version} (Last Update: ${formatDateFull()})
 * @license ${pkg.license}
 * @link ${pkg.repository.url}
 * @link https://baendlorel.github.io/ Welcome to my site!
 * @description ${pkg.description.replace(/\n/g, '\n * \n * ')}
 * @copyright Copyright (c) ${new Date().getFullYear()} ${pkg.author.name}. All rights reserved.`;

/**
 * @type {import('@rollup/plugin-replace').RollupReplaceOptions}
 */
export const replaceOpts = {
  preventAssignment: true,
  values: {
    __IS_DEV__: 'false',
    __NAME__,
    __KEBAB_NAME__,
    __PKG_INFO__,
    // __OPTS__: `Rollup${__NAME__}Options`,
    // __STRICT_OPTS__: `Rollup${__NAME__}StrictOptions`,
  },
};

/**
 * @type {Record<string, any>}
 */
export const replaceLiteralOpts = {
  'declare const __IS_DEV__: boolean;\n': '',
  // & This flag is used to export types only when generating declaration files.
  // '//__EXPORT_FLAG__\n':'export '
};
