import { existsSync, readFileSync, writeFileSync } from "node:fs";

const pkgPath = process.argv[2];
const tauriPath = process.argv[3];
const cargoPath = process.argv[4];
const newVersion = process.argv[5];
const cargoLockPath = process.argv[6];

if (!pkgPath || !tauriPath || !cargoPath || !newVersion) {
  console.error("Usage: node scripts/bump-version.mjs <package.json> <tauri.conf.json> <Cargo.toml> <newVersion> [Cargo.lock]");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

const tauri = JSON.parse(readFileSync(tauriPath, "utf8"));
tauri.version = newVersion;
writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + "\n");

let cargo = readFileSync(cargoPath, "utf8");
cargo = cargo.replace(/^(\[package\][\s\S]*?^version\s*=\s*\")([^\"]+)(\")/m, "$1" + newVersion + "$3");
writeFileSync(cargoPath, cargo);

if (cargoLockPath && existsSync(cargoLockPath)) {
  let cargoLock = readFileSync(cargoLockPath, "utf8");
  const packageNameMatch = cargo.match(/^\[package\][\s\S]*?^name\s*=\s*\"([^\"]+)\"/m);

  if (packageNameMatch) {
    const packageName = packageNameMatch[1];
    const escapedPackageName = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const packagePattern = new RegExp(
      '(\\[\\[package\\]\\]\\nname\\s*=\\s*\"' + escapedPackageName + '\"[\\s\\S]*?^version\\s*=\\s*\")([^\"]+)(\")',
      "m"
    );
    cargoLock = cargoLock.replace(packagePattern, "$1" + newVersion + "$3");
    writeFileSync(cargoLockPath, cargoLock);
  }
}
