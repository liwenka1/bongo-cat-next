#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PACKAGE_JSON="$REPO_ROOT/package.json"
TAURI_CONF="$REPO_ROOT/src-tauri/tauri.conf.json"
CARGO_TOML="$REPO_ROOT/src-tauri/Cargo.toml"

cd "$REPO_ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is required"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is required"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree is not clean. Commit or stash your changes first."
  exit 1
fi

CURRENT_VERSION=$(node -p "require('$PACKAGE_JSON').version")

echo "Current version: $CURRENT_VERSION"
echo ""
echo "Enter new version (e.g. 0.2.4-beta.1):"
read -r NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
  echo "Error: version cannot be empty"
  exit 1
fi

if [ "$NEW_VERSION" = "$CURRENT_VERSION" ]; then
  echo "Error: new version is the same as current version"
  exit 1
fi

if ! echo "$NEW_VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$'; then
  echo "Error: invalid version format"
  exit 1
fi

if git rev-parse "v$NEW_VERSION" >/dev/null 2>&1; then
  echo "Error: tag v$NEW_VERSION already exists"
  exit 1
fi

node -e "
const fs = require('fs');

const packageJsonPath = process.argv[1];
const tauriConfPath = process.argv[2];
const cargoTomlPath = process.argv[3];
const newVersion = process.argv[4];

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
pkg.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');

const tauri = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
tauri.version = newVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauri, null, 2) + '\n');

const cargoSource = fs.readFileSync(cargoTomlPath, 'utf8');
const cargoNext = cargoSource.replace(
  /^(\\[package\\][\\s\\S]*?^version\\s*=\\s*\")([^\"]+)(\")/m,
  '\$1' + newVersion + '\$3'
);
if (cargoNext === cargoSource) {
  throw new Error('Failed to update Cargo.toml version');
}
fs.writeFileSync(cargoTomlPath, cargoNext);
" "$PACKAGE_JSON" "$TAURI_CONF" "$CARGO_TOML" "$NEW_VERSION"

echo ""
echo "Done: $CURRENT_VERSION -> $NEW_VERSION"

git add "$PACKAGE_JSON" "$TAURI_CONF" "$CARGO_TOML"
git commit -m "release: v$NEW_VERSION"
git tag "v$NEW_VERSION"
git push origin main
git push origin "v$NEW_VERSION"

echo ""
echo "Pushed tag v$NEW_VERSION, GitHub Actions will build automatically"
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PACKAGE_JSON="$REPO_ROOT/package.json"
TAURI_CONF="$REPO_ROOT/src-tauri/tauri.conf.json"
CARGO_TOML="$REPO_ROOT/src-tauri/Cargo.toml"

cd "$REPO_ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is required."
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is required."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree is not clean. Commit or stash your changes first."
  exit 1
fi

CURRENT_VERSION="$(node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(p.version);" "$PACKAGE_JSON")"

echo "Current version: $CURRENT_VERSION"
echo ""
read -r -p "Enter new version (e.g. 0.2.4 or 0.2.4-beta.1): " NEW_VERSION

if [ -z "${NEW_VERSION}" ]; then
  echo "Error: version cannot be empty."
  exit 1
fi

if [[ "$NEW_VERSION" == "$CURRENT_VERSION" ]]; then
  echo "Error: new version is the same as current version."
  exit 1
fi

if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]; then
  echo "Error: invalid version format."
  exit 1
fi

if git rev-parse "v$NEW_VERSION" >/dev/null 2>&1; then
  echo "Error: tag v$NEW_VERSION already exists."
  exit 1
fi

node -e "
const fs = require('fs');
const pkgPath = process.argv[1];
const tauriPath = process.argv[2];
const cargoPath = process.argv[3];
const newVersion = process.argv[4];

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const tauri = JSON.parse(fs.readFileSync(tauriPath, 'utf8'));
tauri.version = newVersion;
fs.writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n');

let cargo = fs.readFileSync(cargoPath, 'utf8');
cargo = cargo.replace(
  /^(\[package\][\s\S]*?^version\s*=\s*\")([^\"]+)(\")/m,
  '$1' + newVersion + '$3'
);
fs.writeFileSync(cargoPath, cargo);
" "$PACKAGE_JSON" "$TAURI_CONF" "$CARGO_TOML" "$NEW_VERSION"

echo ""
echo "Done: $CURRENT_VERSION -> $NEW_VERSION"

git add "$PACKAGE_JSON" "$TAURI_CONF" "$CARGO_TOML"
git commit -m "release: v$NEW_VERSION"
git tag "v$NEW_VERSION"
git push origin main
git push origin "v$NEW_VERSION"

echo ""
echo "Pushed tag v$NEW_VERSION, GitHub Actions will build automatically."
