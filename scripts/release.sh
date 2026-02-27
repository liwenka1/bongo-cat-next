#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PACKAGE_JSON="$REPO_ROOT/package.json"
TAURI_CONF="$REPO_ROOT/src-tauri/tauri.conf.json"
CARGO_TOML="$REPO_ROOT/src-tauri/Cargo.toml"
CARGO_LOCK="$REPO_ROOT/src-tauri/Cargo.lock"

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

node "$REPO_ROOT/scripts/bump-version.mjs" \
  "$PACKAGE_JSON" \
  "$TAURI_CONF" \
  "$CARGO_TOML" \
  "$NEW_VERSION" \
  "$CARGO_LOCK"

echo ""
echo "Done: $CURRENT_VERSION -> $NEW_VERSION"

git add "$PACKAGE_JSON" "$TAURI_CONF" "$CARGO_TOML"
if git ls-files --error-unmatch "$CARGO_LOCK" >/dev/null 2>&1; then
  git add "$CARGO_LOCK"
fi
git commit -m "release: v$NEW_VERSION"
git tag "v$NEW_VERSION"
git push origin main
git push origin "v$NEW_VERSION"

echo ""
echo "Pushed tag v$NEW_VERSION, GitHub Actions will build automatically."
