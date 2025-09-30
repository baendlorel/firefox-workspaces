// @ts-check
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
/**
 * @type {import('../package.json')}
 */
const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf-8'));

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

const __DATE_TIME__ = formatDateFull();
const __KEBAB_NAME__ = pkg.name.replace('rollup-plugin-', '');
const __NAME__ = __KEBAB_NAME__.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());

const __PKG_INFO__ = `## About
 * @package ${__NAME__}
 * @author ${pkg.author.name} <${pkg.author.email}>
 * @version ${pkg.version} (Last Update: ${__DATE_TIME__})
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
    __IS_DEV__: process.env.NODE_ENV === 'development' ? 'true' : 'false',
    __NAME__,
    __KEBAB_NAME__,
    __PKG_INFO__,
    __VERSION__: pkg.version,
    __DATE_TIME__,
    // __OPTS__: `Rollup${__NAME__}Options`,
    // __STRICT_OPTS__: `Rollup${__NAME__}StrictOptions`,
  },
};

/**
 * @type {Record<string, any>}
 */
export const replaceLiteralOpts = {
  'declare const __IS_PROD__: boolean;\n': '',
  'const __IS_PROD__: boolean;\n': '',
  'logger.info(': "console.log(`%c[__NAME__ info] __func__:`, 'color:blue',",
  'logger.warn(': "console.log(`%c[__NAME__ info] __func__:`, 'color:orange',",
  'logger.error(': "console.log(`%c[__NAME__ info] __func__:`, 'color:red',",
  'logger.debug(': "console.log(`%c[__NAME__ info] __func__:`, 'color:purple',",
  'logger.WorkspaceNotFound(':
    "console.log(`%c[__NAME__ error] __func__:`, 'color:red','Workspace not found, id:',",
  'logger.TabNotFoundInWorkspace(':
    "console.log(`%c[__NAME__ error] __func__:`, 'color:red','Tab not found in workspace. tabid,workspaceid:',",
};
