// @ts-check
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { execute } from './execute.mjs';

/**
 * @typedef {object} RollupOutput
 * @property {string|undefined} [file]
 */

/**
 * @typedef {object} RollupConfigChunk
 * @property {RollupOutput|RollupOutput[]} [output]
 */

/**
 * Safely coerce a value to an array. If value is an array, return it.
 * If it's an object (but not null), return an empty array. Otherwise wrap in array.
 * NOTE: returns any[] to avoid strict generic assignment issues under @ts-check
 * @param {any} o
 * @returns {any[]}
 */
const toArr = (o) => (Array.isArray(o) ? o : typeof o === 'object' && o !== null ? [] : [o]);

/**
 * Extract output file paths from rollup config
 * @param {RollupConfigChunk|RollupConfigChunk[]} rollupConfig
 * @returns {string[]}
 */
function getOutputFiles(rollupConfig) {
  const output = /** @type {Array<{file?:string|undefined}>} */ ([]);
  toArr(rollupConfig).forEach((c) => output.push(...toArr(c.output)));
  // filter out entries without file and coerce to string
  return output.map((o) => o.file).filter((f) => typeof f === 'string');
}

/**
 * Print file sizes to the console.
 * @param {string[]} files
 * @returns {void}
 */
function printSize(files) {
  /**
   * @param {number} maxLen
   * @returns {(arg:{file:string,size:number}) => string}
   */
  const mapper =
    (maxLen) =>
    ({ file, size }) =>
      `${file.padEnd(maxLen, ' ')} - ${(size / 1024).toFixed(3)} KB`;
  let maxLen = 0;
  let total = 0;

  /** @type {{file:string,size:number}[]} */
  const info = [];
  files.forEach((file) => {
    try {
      const size = statSync(file).size;
      maxLen = Math.max(maxLen, file.length);
      total += size;
      info.push({ file, size });
    } catch (e) {
      console.warn(`${file}: Not found or no permission to read`, e);
    }
  });

  info.sort((a, b) => a.size - b.size);
  info.push({ file: 'Total', size: total });
  console.log(info.map(mapper(maxLen)).join('\n'));
}

/**
 * Because Node.js finds the package from current project first,
 * we need to rename the package temporarily to make it search node_modules
 */
class Renamer {
  /** @type {string} */
  origin = '';
  /** @type {any} */
  packageJson;
  /** @type {string} */
  packageJsonPath;

  /**
   * @param {string} packageJsonPath
   */
  constructor(packageJsonPath) {
    this.packageJsonPath = packageJsonPath;
    this.origin = readFileSync(packageJsonPath, 'utf-8');
    this.packageJson = JSON.parse(this.origin);
  }

  /**
   * Real package name read from package.json content
   * @returns {string}
   */
  get realName() {
    return JSON.parse(this.origin).name;
  }

  /**
   * Read current package.json text
   * @returns {string}
   */
  read() {
    return readFileSync(this.packageJsonPath, 'utf-8');
  }

  /**
   * Write package.json content
   * @param {string} content
   * @returns {void}
   */
  write(content) {
    return writeFileSync(this.packageJsonPath, content, 'utf-8');
  }

  /**
   * Temporarily rename package.json if purpose is rollup-plugin
   * @returns {void}
   */
  useTempName() {
    if (this.packageJson.purpose !== 'rollup-plugin') {
      console.log('Not a rollup plugin. Skip renaming package.json');
      return;
    }
    this.origin = this.read();
    const j = JSON.parse(this.origin);
    j.name = 'kasukabe-tsumugi-temporary-name';
    this.write(JSON.stringify(j, null, 2));
  }

  /**
   * Restore original package.json content
   * @returns {void}
   */
  restoreRealName() {
    if (this.packageJson.purpose !== 'rollup-plugin') {
      console.log('Not a rollup plugin. Skip restoring package.json');
      return;
    }
    this.write(this.origin);
  }
}

/**
 * Run the build script: rename package if needed, clean dist, run rollup
 * and print sizes.
 */
async function run() {
  const renamer = new Renamer(join(import.meta.dirname, '..', 'package.json'));

  process.env.KSKB_TSUMUGI_REAL_NAME = renamer.realName;

  try {
    renamer.useTempName();

    await execute(['rimraf', 'dist']);

    const { name, version, purpose } = renamer.packageJson;
    console.log(`Building`, `[${purpose}]`, name, version);

    // ! Must read configs here, or nodejs will not
    // ! be able to find the installed package of this project
    const rollupConfig = (await import('../rollup.config.mjs')).default;

    await execute(['rollup', '-c'], { env: { ...process.env } });

    const files = getOutputFiles(rollupConfig);
    printSize(files);
  } catch (error) {
    console.log('error', error);
  } finally {
    renamer.restoreRealName();
  }
}

run();
