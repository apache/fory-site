#!/bin/bash
# Copy fallback folders from English docs to Chinese i18n.
# This ensures links to shared docs files work in Chinese docs.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ZH_CN_DOCS="$ROOT_DIR/i18n/zh-CN/docusaurus-plugin-content-docs"

copy_folder_to_zh() {
  local folder_name="$1"

  echo "Copying $folder_name folders to Chinese i18n..."

  # Copy current docs folder
  if [ -d "$ROOT_DIR/docs/$folder_name" ]; then
    local current_target="$ZH_CN_DOCS/current/$folder_name"
    mkdir -p "$current_target"
    # Preserve translated files: only copy files that don't already exist.
    rsync -a --ignore-existing "$ROOT_DIR/docs/$folder_name/" "$current_target/"
    echo "  Synced missing docs/$folder_name -> current/$folder_name"
  fi

  # Copy versioned docs folder
  for version_dir in "$ROOT_DIR/versioned_docs"/version-*; do
    if [ -d "$version_dir/$folder_name" ]; then
      local version
      version=$(basename "$version_dir")
      local version_target="$ZH_CN_DOCS/$version/$folder_name"
      mkdir -p "$version_target"
      # Preserve translated files: only copy files that don't already exist.
      rsync -a --ignore-existing "$version_dir/$folder_name/" "$version_target/"
      echo "  Synced missing versioned_docs/$version/$folder_name -> $version/$folder_name"
    fi
  done
}

copy_folder_to_zh "specification"
copy_folder_to_zh "benchmarks"

echo "Done copying fallback folders."
