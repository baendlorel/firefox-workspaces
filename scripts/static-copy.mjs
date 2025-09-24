// @ts-check
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

/**
 * Recursively copy files from srcDir to destDir
 * @param {string} srcDir
 * @param {string} destDir
 */
async function copyDir(srcDir, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * @param {Object} options
 * @param {Record<string, string>} options.map - key: srcDir, value: destDir
 * @returns {import('vite').Plugin}
 */
export default function staticCopy(options = { map: {} }) {
  const map = options.map || {};
  return {
    name: 'static-copy',
    apply: 'build',
    async closeBundle() {
      for (const [srcRel, destRel] of Object.entries(map)) {
        const src = resolve(process.cwd(), srcRel);
        const dest = resolve(process.cwd(), destRel);
        try {
          await copyDir(src, dest);
          // eslint-disable-next-line no-console
          console.log(`[static-copy] Copied ${srcRel} to ${destRel}`);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`[static-copy] Failed to copy ${srcRel}:`, e);
        }
      }
    },
  };
}
