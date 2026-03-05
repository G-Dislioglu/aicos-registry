# AICOS Registry Migration Log

## 2026-03-05: Meta Cards Migration & ID Normalization

### Summary
Migrated Maya cards from `cards/solutions/` to `cards/meta/` and normalized their IDs and types. This establishes a clear distinction between solution proofs and meta principles.

### Changes

#### 1. New Directory Structure
- Created `cards/meta/` directory for meta principle cards
- Moved 5 Maya cards from `cards/solutions/` to `cards/meta/`

#### 2. ID Migrations

| Old ID | New ID | File Move |
|--------|--------|-----------|
| `sol-maya-001` | `meta-001` | `sol-maya-001.json` → `meta-001.json` |
| `sol-maya-002` | `meta-002` | `sol-maya-002.json` → `meta-002.json` |
| `sol-maya-003` | `meta-003` | `sol-maya-003.json` → `meta-003.json` |
| `sol-maya-004` | `meta-004` | `sol-maya-004.json` → `meta-004.json` |
| `sol-maya-005` | `meta-005` | `sol-maya-005.json` → `meta-005.json` |

#### 3. Type Changes
All migrated cards changed from `type: "solution_proof"` to `type: "meta_principle"`.

#### 4. Link Updates
Updated all internal references in other cards:
- `sol-cross-007` through `sol-cross-039` 
- `sol-dev-005`, `sol-dev-006`
- `sol-arch-003`

All `sol-maya-XXX` references updated to `meta-XXX`.

#### 5. Aliases
Each migrated card now has an `aliases` field containing its old ID:
```json
{
  "id": "meta-001",
  "aliases": ["sol-maya-001"],
  ...
}
```

#### 6. ALIASES.json
Created `index/ALIASES.json` for programmatic old→new ID resolution:
```json
{
  "aliases": {
    "sol-maya-001": "meta-001",
    "sol-maya-002": "meta-002",
    ...
  }
}
```

### Generators Added

#### `tools/generate-index.js`
- Scans `cards/errors/`, `cards/solutions/`, `cards/meta/`
- Validates required fields
- Generates `index/INDEX.json` deterministically (sorted by ID)

#### `tools/generate-human-registry.js`
- Reads `index/INDEX.json`
- Generates `human/REGISTRY.md` with sections for each card type
- Marked as `GENERATED - DO NOT EDIT`

### Backward Compatibility

Old IDs remain resolvable via:
1. `index/ALIASES.json` (programmatic)
2. `aliases` field in each card (self-documenting)

Agents should check ALIASES.json when a referenced ID is not found.

### Statistics After Migration

| Type | Count |
|------|-------|
| Error Patterns | 17 |
| Solution Proofs | 60 |
| Meta Principles | 6 |
| **Total** | **83** |

### Notes

- Legacy IDs like `err-dev-01`, `err-api-01` were NOT migrated (preserved for stability)
- New cards should follow the normalized ID scheme: `err-<area>-NNN`, `sol-<area>-NNN`, `meta-NNN`
- `meta-006` was already in `cards/meta/` but had `type: solution_proof` — updated to `type: meta_principle`
