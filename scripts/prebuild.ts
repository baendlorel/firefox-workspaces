import fs from 'node:fs';

function getGreater(ver1: string, ver2: string) {
  const arr1 = ver1.split('.').map((v) => parseInt(v));
  const arr2 = ver2.split('.').map((v) => parseInt(v));
  for (let i = 0; i < 3; i++) {
    const num1 = arr1[i] || 0;
    const num2 = arr2[i] || 0;
    if (num1 > num2) return ver1;
    if (num1 < num2) return ver2;
  }
  return ver1;
}

function syncVersion() {
  const manifest = JSON.parse(
    fs.readFileSync('manifest.json', 'utf-8')
  ) as typeof import('../manifest.json');

  const pkg = JSON.parse(
    fs.readFileSync('package.json', 'utf-8')
  ) as typeof import('../package.json');

  const latest = getGreater(manifest.version, pkg.version);

  pkg.version = latest;
  manifest.version = latest;
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}
syncVersion();
