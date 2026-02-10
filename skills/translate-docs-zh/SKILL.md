---
name: translate-docs-zh
description: Translate Apache Fory docs into Simplified Chinese and maintain existing Chinese translations by diffing English source changes. Use when asked to translate docs, sync i18n/zh-CN content, remove placeholder Chinese-intro notices, or update already-translated files after English docs changed. Strict rule: do NOT use any external translation service, API, website, or translation CLI tool; translation must be done directly by Codex.
---

# Translate Docs (zh-CN)

Translate documentation into Simplified Chinese and keep existing Chinese docs aligned with English source updates.

## Hard Constraints

- Do not call external translation tools.
- Do not use translation websites/services/APIs (Google/Baidu/DeepL/Youdao/OpenAI translation API wrappers, etc.).
- Do not use local translation CLIs or plugins.
- Translate directly in-place by Codex reasoning and editing only.

## Terminology Reference (Required)

- Always apply the terminology standard in `references/terminology.md`.
- If existing Chinese wording conflicts with the terminology table, normalize to the table unless user explicitly requests otherwise.
- For newly introduced English terms, append a proposed entry to the terminology table when the term is likely to recur.

## Path Mapping

Map source and target paths with these rules:

1. Current docs:
- Source: `docs/<subpath>.md`
- Target: `i18n/zh-CN/docusaurus-plugin-content-docs/current/<subpath>.md`

2. Versioned docs:
- Source: `versioned_docs/version-X/<subpath>.md`
- Target: `i18n/zh-CN/docusaurus-plugin-content-docs/version-X/<subpath>.md`

3. Category labels:
- Source: `docs/**/_category_.json`
- Target: `i18n/zh-CN/docusaurus-plugin-content-docs/**/_category_.json`

4. Sidebar top-level label i18n keys:
- Target: `i18n/zh-CN/docusaurus-plugin-content-docs/current.json`
- Optional version keys: `i18n/zh-CN/docusaurus-plugin-content-docs/version-*.json`

## Workflow

### Step 1: Discover file pairs

1. Build source-target pairs from user scope.
2. If user gives only Chinese targets, infer matching English source by reverse mapping.
3. Skip pairs whose source file does not exist; report them clearly.

### Step 2: Classify each Chinese file

Classify as `untranslated` or `translated`.

Treat as `untranslated` if any condition is true:

- Target file missing.
- Contains placeholder notices like `中文导读` / `中文章节导读`.
- Non-code prose is mostly English.
- Headings/body are largely English while only title/frontmatter is Chinese.

Otherwise classify as `translated`.

### Step 3A: Handle untranslated files (full translation)

1. Translate the entire document from current English source.
2. Keep frontmatter keys and structure valid.
3. Keep identifiers/code/protocol fields/CLI flags in English.
4. Translate headings, prose, table descriptions, and comments meant for readers.
5. Remove placeholder intro notices (`中文导读` style blocks).
6. Preserve link targets and anchors unless a better Chinese heading requires an explicit anchor.

### Step 3B: Handle translated files (diff-based maintenance)

1. Find source changes since last Chinese update baseline.
2. Prefer this baseline method:
- `zh_last_commit = git log -1 --format=%H -- <zh_file>`
- `git diff --unified=0 <zh_last_commit>..HEAD -- <source_file>`
3. If no source diff, keep Chinese file unchanged.
4. If source diff exists, decide update strategy:

Use **partial update** when all are true:
- Changes are local and limited.
- Document structure mostly unchanged.
- No widespread terminology shifts.

Use **full rewrite** when any is true:
- Large structural edits (section reordering/splitting/merging).
- Significant rewrite of core semantics.
- Many scattered edits across the document.
- Existing Chinese wording quality is inconsistent or outdated.

5. Apply translations only for changed semantics; keep unaffected Chinese content stable.
6. If full rewrite is chosen, regenerate complete Chinese content from latest English source.

## Translation Quality Rules

1. Prioritize semantic correctness over literal wording.
2. Keep terminology consistent across files.
3. Avoid awkward literal phrases (for example avoid unnatural jargon calques).
4. Keep technical precision:
- Distinguish encoding format vs transport framework concepts.
- Keep units, ranges, and bit layouts exact.
5. Preserve examples and command behavior exactly.

## Validation Checklist

Run checks after edits:

1. Placeholder cleanup:
- `rg -n "中文导读|中文章节导读" i18n/zh-CN -S`

2. Markdown integrity:
- Ensure code fences are balanced.
- Ensure tables render (pipes/alignment valid).
- Ensure frontmatter remains valid YAML.

3. MDX safety:
- Avoid standalone lines that MDX may parse as ESM (`import ...`, `export ...`) in prose.

4. Link/anchor sanity:
- Preserve existing inbound anchors where possible.

5. Optional build verification (recommended):
- `npm run build -- --locale zh-CN`

## Decision Heuristics for Rewrite vs Patch

Use this pragmatic threshold (guide, not absolute):

- Patch when source changed prose is small and localized.
- Rewrite when changed prose is broad, central, or distributed across many sections.

When uncertain, prefer full rewrite for short/medium docs and targeted patch for very large docs with clearly isolated changes.

## Output Requirements for the user

Report clearly:

1. Files fully translated.
2. Files partially updated by source diff.
3. Files fully rewritten due to large source changes.
4. Validation results and any unresolved risks.
