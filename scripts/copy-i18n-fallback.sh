#!/bin/bash
# Copy specification folders from English docs to Chinese i18n as fallback
# This ensures links to specification files work in Chinese docs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ZH_CN_DOCS="$ROOT_DIR/i18n/zh-CN/docusaurus-plugin-content-docs"

echo "Copying specification folders to Chinese i18n..."

# Copy current docs specification
if [ -d "$ROOT_DIR/docs/specification" ]; then
  mkdir -p "$ZH_CN_DOCS/current/specification"
  cp -r "$ROOT_DIR/docs/specification/"* "$ZH_CN_DOCS/current/specification/"
  echo "  Copied docs/specification -> current/specification"
fi

# Copy versioned docs specification
for version_dir in "$ROOT_DIR/versioned_docs"/version-*; do
  if [ -d "$version_dir/specification" ]; then
    version=$(basename "$version_dir")
    target_dir="$ZH_CN_DOCS/$version/specification"
    mkdir -p "$target_dir"
    cp -r "$version_dir/specification/"* "$target_dir/"
    echo "  Copied versioned_docs/$version/specification -> $version/specification"
  fi
done

echo "Done copying specification folders."
