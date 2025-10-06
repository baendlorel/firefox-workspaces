import fs from 'node:fs';

function syncVersion() {
  const manifest = JSON.parse(
    fs.readFileSync('manifest.json', 'utf-8')
  ) as typeof import('../manifest.json');

  const pkg = JSON.parse(
    fs.readFileSync('package.json', 'utf-8')
  ) as typeof import('../package.json');

  pkg.version = manifest.version;

  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
}
syncVersion();
