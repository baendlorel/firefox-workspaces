import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

// Clear web-ext-artifacts, run web-ext build, run zip script and rename output zip
function pack() {
  const root = process.cwd();
  const outDir = path.join(root, 'web-ext-artifacts');

  // 1) clear web-ext-artifacts
  if (fs.existsSync(outDir)) {
    console.log('Removing existing', outDir);
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  // 2) run web-ext build (it will create web-ext-artifacts by default)
  console.log('Running web-ext build...');
  execFileSync('web-ext', ['build'], { cwd: root, stdio: 'inherit' });

  // 3) run the zip script to create source-code.zip
  console.log('Running zip script (.scripts/zip.ts)...');
  execFileSync('tsx', ['.scripts/zip.ts'], { cwd: root, stdio: 'inherit' });

  // 4) rename zip to workspaces-<version>-source.zip (version from manifest.json or package.json)
  const generatedZip = path.join(outDir, 'source-code.zip');
  if (!fs.existsSync(generatedZip)) {
    throw new Error('Expected zip not found at ' + generatedZip);
  }

  let version = '0.0.0';
  const manifestPath = path.join(root, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const mf = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (mf && mf.version) version = String(mf.version);
  } else {
    const pkgPath = path.join(root, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg && pkg.version) version = String(pkg.version);
    }
  }

  const finalName = `workspace-${version}-source.zip`;
  const finalPath = path.join(outDir, finalName);

  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  fs.renameSync(generatedZip, finalPath);
  console.log('Renamed', generatedZip, '->', finalPath);
}

pack();
