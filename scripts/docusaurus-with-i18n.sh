#!/usr/bin/env bash

# Wrap Docusaurus CLI. For docs:version, also copy i18n docs current/ into
# version-<version>/ so locale docs are versioned in one command.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DOCUSAURUS_BIN="$ROOT_DIR/node_modules/.bin/docusaurus"

run_docusaurus() {
  if [ -x "$DOCUSAURUS_BIN" ]; then
    "$DOCUSAURUS_BIN" "$@"
  else
    docusaurus "$@"
  fi
}

copy_i18n_docs_version() {
  local version="$1"
  local copied=0

  for locale_docs_dir in "$ROOT_DIR"/i18n/*/docusaurus-plugin-content-docs; do
    if [ ! -d "$locale_docs_dir/current" ]; then
      continue
    fi

    local locale
    locale="$(basename "$(dirname "$locale_docs_dir")")"
    local target="$locale_docs_dir/version-$version"

    if [ -e "$target" ]; then
      echo "Skipping i18n docs for $locale: ${target#$ROOT_DIR/} already exists."
      continue
    fi

    mkdir -p "$target"
    cp -R "$locale_docs_dir/current/." "$target/"
    echo "Copied i18n docs for $locale -> ${target#$ROOT_DIR/}"
    copied=1
  done

  if [ "$copied" -eq 0 ]; then
    echo "No i18n docs current/ directories found. Skipped i18n version copy."
  fi
}

if [ "${1:-}" = "docs:version" ] && [ -n "${2:-}" ] && [[ "${2:-}" != -* ]]; then
  version="$2"
  run_docusaurus "$@"
  copy_i18n_docs_version "$version"
else
  run_docusaurus "$@"
fi
