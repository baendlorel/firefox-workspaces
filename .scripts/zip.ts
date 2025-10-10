import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

function tar() {
  const root = process.cwd();

  const items = [
    '_locales',
    '.scripts',
    '.vscode',
    'pages',
    'public',
    'src',
    '.gitignore',
    '.oxlintrc.json',
    'LICENSE',
    'manifest.json',
    'package.json',
    'pnpm-lock.yaml',
    'README.md',
    'tsconfig.build.json',
    'tsconfig.json',
    'vite.config.js',
    'vitest.config.ts',
  ];

  const outDir = path.join(root, 'web-ext-artifacts');
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, 'source-code.tar');

  const existing = items.filter((p) => fs.existsSync(path.join(root, p)));

  if (existing.length === 0) {
    console.error('No files or directories found to add to the tarball. Aborting.');
    process.exit(1);
  }

  // Use system tar to avoid adding an extra dependency. Run from repo root so paths
  // inside the archive are relative and do not contain absolute prefixes.
  const args = ['-cf', path.relative(root, outFile), ...existing];

  try {
    console.log('Creating tarball:', outFile);
    execFileSync('tar', args, { cwd: root, stdio: 'inherit' });
    console.log(`Created ${outFile}`);
  } catch (err: any) {
    console.log('Failed to create tarball:', err && err.message ? err.message : err);
    process.exit(err && err.status ? err.status : 1);
  }
}

function zip() {
  const root = process.cwd();

  const items = [
    '_locales',
    '.scripts',
    '.vscode',
    'pages',
    'public',
    'src',
    '.gitignore',
    '.oxlintrc.json',
    'LICENSE',
    'manifest.json',
    'package.json',
    'pnpm-lock.yaml',
    'README.md',
    'tsconfig.build.json',
    'tsconfig.json',
    'vite.config.js',
    'vitest.config.ts',
  ];

  const outDir = path.join(root, 'web-ext-artifacts');
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, 'source-code.zip');

  const existing = items.filter((p) => fs.existsSync(path.join(root, p)));

  if (existing.length === 0) {
    console.error('No files or directories found to add to the zip. Aborting.');
    process.exit(1);
  }

  // Remove existing zip to ensure a fresh archive
  try {
    if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
  } catch (e) {
    // ignore
  }

  // Use system zip to avoid adding dependencies. Run from repo root so paths
  // inside the archive are relative.
  const args = ['-r', path.relative(root, outFile), ...existing];

  try {
    console.log('Creating zip archive:', outFile);
    execFileSync('zip', args, { cwd: root, stdio: 'inherit' });
    console.log(`Created ${outFile}`);
  } catch (err: any) {
    console.error('Failed to create zip archive:', err && err.message ? err.message : err);
    process.exit(err && err.status ? err.status : 1);
  }
}

zip();
