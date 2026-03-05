# AICOS Registry

AICOS Registry is a **JSON-based knowledge database** for:

- **Error patterns** you repeatedly encounter (symptoms, repro, root cause, guardrails)
- **Proven solutions** that fix or mitigate those patterns (steps, tradeoffs, rollback)
- **Meta principles** that define foundational governance patterns (cross-domain, philosophical)

The goal is to make troubleshooting and agent workflows deterministic: find a matching error card, follow linked solution cards, and record evidence.

## Repository Structure

```
aicos-registry/
├── cards/
│   ├── errors/       # Error pattern cards (type: error_pattern)
│   ├── solutions/    # Solution proof cards (type: solution_proof)
│   └── meta/         # Meta principle cards (type: meta_principle)
├── index/
│   ├── INDEX.json    # Lightweight registry index (GENERATED)
│   └── ALIASES.json  # Old ID → New ID mapping for backward compatibility
├── human/
│   └── REGISTRY.md   # Human-readable overview (GENERATED - DO NOT EDIT)
├── tools/
│   ├── generate-index.js         # Generates INDEX.json from cards/
│   └── generate-human-registry.js # Generates REGISTRY.md from INDEX.json
└── README.md
```

## ID Conventions

All card IDs follow a normalized scheme:

| Type | Pattern | Example |
|------|---------|---------|
| Error | `err-<area>-NNN` | `err-audio-001`, `err-api-001` |
| Solution | `sol-<area>-NNN` | `sol-audio-001`, `sol-cross-007` |
| Meta | `meta-NNN` | `meta-001`, `meta-006` |

**Note:** Some legacy IDs may not follow this pattern (e.g., `err-dev-01`). These are preserved for stability but new cards should use the normalized format.

## How agents should use this registry

1. **Start with `index/INDEX.json`**
   - Filter by `domain`, `tags`, `status`, and `token`
2. **Open the referenced card JSON**
   - `cards/errors/<id>.json`, `cards/solutions/<id>.json`, or `cards/meta/<id>.json`
3. **Follow links**
   - Error cards link to solution cards via `links.fixes`
   - Solution cards link back via `links.causes`
   - Meta cards link to related meta cards via `links.related`
4. **Record evidence and guardrails**
   - Use `evidence.signals` to confirm you're seeing the same failure mode
   - Use `guardrails` / `prevent_tests` to prevent regressions

## Generating Files

**All generated files are marked with `GENERATED - DO NOT EDIT`.**

```bash
# Generate INDEX.json from all cards
node tools/generate-index.js

# Generate human/REGISTRY.md from INDEX.json
node tools/generate-human-registry.js

# Run both
node tools/generate-index.js && node tools/generate-human-registry.js
```

## Authoring Rules

- **IDs are stable** and used as primary keys (e.g. `err-...`, `sol-...`, `meta-...`)
- **`token` is a searchable slug** that should be globally unique
- **Keep cards JSON-valid** (strict JSON, double quotes, no trailing commas)
- **Always regenerate INDEX.json** when adding/removing/modifying cards
- **Never edit `human/REGISTRY.md` directly** — it's auto-generated

## Card Schema (Minimal)

Every card must have these required fields:

```json
{
  "id": "sol-audio-001",
  "type": "solution_proof",
  "token": "speech_state_machine",
  "title": "Speech State Machine with Guards",
  "domain": ["audio", "frontend"],
  "tags": ["theme:state_machine", "theme:guards"],
  "status": "active"
}
```

Optional but recommended:
- `essence`: Core insight in 1-2 sentences
- `steps`: Actionable implementation steps
- `links.fixes`: Error IDs this solution fixes
- `links.related`: Related card IDs
- `aliases`: Old IDs if this card was renamed/migrated

## Backward Compatibility

If a card was renamed or moved, use `index/ALIASES.json` to resolve old IDs:

```json
{
  "aliases": {
    "sol-maya-001": "meta-001"
  }
}
```

Agents should check ALIASES.json if a referenced ID doesn't exist.

## Statistics

- **17** Error Patterns
- **60** Solution Proofs
- **6** Meta Principles
- **83** Total Cards
