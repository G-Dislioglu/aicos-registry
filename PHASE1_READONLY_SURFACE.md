# PHASE1_READONLY_SURFACE

Stand: 2026-03-07
Status: Minimal read-only access surface for Phase 1

## 1. Purpose

This document describes the minimal access surface added for Phase 1.

It is intentionally small.
It exists to provide practical read-only access to the registry without introducing write-capable runtime behavior.

## 2. Files

- `tools/registry-readonly-lib.js`
- `tools/registry-readonly.js`
- `tools/verify-phase1-readonly.js`

## 3. Data Sources

The read-only surface uses only existing registry artifacts:

- `index/INDEX.json`
- `index/ALIASES.json`
- `cards/errors/*.json`
- `cards/solutions/*.json`
- `cards/meta/*.json`

It does not write to any of them.

## 4. Supported Operations

### Stats

```bash
node tools/registry-readonly.js stats
```

Returns:
- total card count
- alias count
- card totals by type

### List

```bash
node tools/registry-readonly.js list
node tools/registry-readonly.js list --type solution_proof --domain biology --limit 5
node tools/registry-readonly.js list --tag theme:state_machine --status active
node tools/registry-readonly.js list --q registry
```

Supported filters:
- `--type`
- `--domain`
- `--tag`
- `--status`
- `--q`
- `--limit`
- `--json`

Behavior:
- listing is based on `index/INDEX.json`
- filters are exact-match for `type`, `domain`, `tag`, and `status`
- text query performs case-insensitive substring matching over `id`, `token`, and `title`

### Resolve

```bash
node tools/registry-readonly.js resolve sol-maya-001
node tools/registry-readonly.js resolve meta-001 --json
```

Returns:
- requested ID
- resolved canonical ID
- whether alias resolution occurred
- whether the resolved card exists in the current index
- card type if known

### Get

```bash
node tools/registry-readonly.js get err-api-004
node tools/registry-readonly.js get sol-maya-001
```

Behavior:
- resolves aliases first when applicable
- then loads the full card JSON from the canonical `cards/` path
- returns the full read-only card payload

## 5. Read-Only Boundary

This surface does not:
- regenerate artifacts
- update cards
- change aliases
- change taxonomies
- write to `index/`
- write to `human/`

## 6. Verification

Run:

```bash
node tools/verify-phase1-readonly.js
```

This checks:
- required Phase 1 files exist
- new Phase 1 scripts do not contain write APIs
- filtered list access works
- alias resolution works
- full card lookup works
