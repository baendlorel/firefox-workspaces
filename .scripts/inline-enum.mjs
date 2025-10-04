// @ts-check
import fs from 'node:fs';
import path from 'node:path';

// This script scans the repository for `const enum` declarations in .ts files
// and builds an `enumReplaceOpts` object mapping `EnumName.Member` -> literal
// representation. The output is exported so other build scripts (like
// .scripts/replace.mjs) can import it.

/**
 * Recursively collect all .ts files under `dir`, skipping node_modules
 * and generated folders.
 * @param {string} dir
 * @returns {string[]}
 */
function collectTsFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') {
      continue;
    }

    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (e.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Parse const enum bodies and return mapping for each enum member.
 * @param {string} src - file contents
 * @returns {Record<string,string>} - mapping like { 'Consts.StorageKey': '"val"' }
 */
function parseConstEnums(src) {
  const map = Object.create(null);
  // Remove CRLF to simplify
  const text = src.replace(/\r\n/g, '\n');

  // Regex to find `const enum Name { ... }`, optionally prefixed by export/declare
  const enumRe = /(?:export\s+)?(?:declare\s+)?const\s+enum\s+([A-Za-z_$][\w$]*)\s*\{([\s\S]*?)\}/g;
  let m;
  while ((m = enumRe.exec(text)) !== null) {
    const enumName = m[1];
    let body = m[2];

    // strip block comments
    body = body.replace(/\/\*[\s\S]*?\*\//g, '');

    // We'll match members like: KEY = value,  or KEY,
    const memberRe = /([A-Za-z_$][\w$]*)\s*(?:=\s*([^,\n}]+))?,?/g;
    let mm;
    let lastNumeric = null;
    while ((mm = memberRe.exec(body)) !== null) {
      const key = mm[1];
      let valText = mm[2] ? mm[2].trim() : undefined;

      let outVal;
      if (valText === undefined) {
        // No initializer: follow TS numeric enum rule: start from 0 or previous+1
        if (typeof lastNumeric === 'number') {
          lastNumeric = lastNumeric + 1;
        } else {
          lastNumeric = 0;
        }
        outVal = String(lastNumeric);
        map[`${enumName}.${key}`] = outVal;
        continue;
      }

      // Try to recognize string literal
      const strMatch = valText.match(/^(['`"])([\s\S]*)\1$/);
      if (strMatch) {
        // Use JSON.stringify on the inner content to ensure proper escaping and double quotes
        const inner = strMatch[2];
        outVal = JSON.stringify(inner);
        lastNumeric = null; // subsequent implicit members don't get numeric increments
        map[`${enumName}.${key}`] = outVal;
        continue;
      }

      // Numeric or other expression - normalize simple numbers (dec/hex)
      const numMatch = valText.match(/^[-+]?(0x[0-9a-fA-F]+|\d+(?:\.\d+)?)$/);
      if (numMatch) {
        outVal = numMatch[1] ? String(numMatch[1]) : String(valText);
        // parse numeric to keep track for increments
        const parsed = Number(outVal);
        if (Number.isNaN(parsed)) {
          lastNumeric = null;
        } else {
          lastNumeric = parsed;
        }
        map[`${enumName}.${key}`] = outVal;
        continue;
      }

      // Fallback: keep the original text as-is (could be reference or expression)
      outVal = valText;
      lastNumeric = null;
      map[`${enumName}.${key}`] = outVal;
    }
  }
  return map;
}

// Walk project root (one level up from this script) to find .ts files.
const repoRoot = path.resolve(new URL(import.meta.url).pathname, '..', '..');
// convert to platform path (import.meta.url yields file:///...)
const rootPath = path.normalize(repoRoot);

/**
 * Collect mappings from all ts files in the project
 */
function buildEnumReplaceOpts() {
  const files = collectTsFiles(rootPath);
  const combined = Object.create(null);
  for (const f of files) {
    let content = null;
    try {
      content = fs.readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    const map = parseConstEnums(content);
    for (const k of Object.keys(map)) {
      combined[k] = map[k];
    }
  }
  return combined;
}

export const enumReplaceOpts = buildEnumReplaceOpts();
console.log('enumReplaceOpts', enumReplaceOpts);
