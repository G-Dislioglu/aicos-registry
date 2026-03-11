# Architecture Card Crosswalk

## Purpose

This document defines how to interpret architecture-layer references found in `docs/**` without changing live registry truth.
It exists because historical architecture notes may contain:

- legacy aliases
- shorthand labels
- card-family names
- informal architectural names
- phantom IDs that do not exist in the live registry

## Authority Order

Use this precedence order when resolving references:

1. `cards/**`
2. `index/INDEX.json`
3. `index/ALIASES.json`
4. `human/REGISTRY.md`
5. `docs/**` architecture notes

`docs/**` is a human architecture reference layer. It is not the source of truth for canonical IDs.

## Hard Rules

- Do not create or mutate canonical IDs from architecture prose alone.
- Do not expand `index/ALIASES.json` based on architecture documents.
- Do not treat undocumented historical names as valid card identifiers.
- If a docs reference conflicts with a live card, the live card wins.
- If a docs reference has no live match and no alias mapping, classify it as a phantom reference.

## Live Registry Facts

The current repo contains a narrow backward-compatibility alias layer in `index/ALIASES.json`:

- `sol-maya-001` → `meta-001`
- `sol-maya-002` → `meta-002`
- `sol-maya-003` → `meta-003`
- `sol-maya-004` → `meta-004`
- `sol-maya-005` → `meta-005`

No broader `aicos-*` alias space is defined in the live registry.

## Exact Live References Confirmed

| Reference | Classification | Live Resolution | Notes |
|---|---|---|---|
| `meta-004` | exact_live_id | `cards/meta/meta-004.json` | Freshness Sentinel |
| `meta-006` | exact_live_id | `cards/meta/meta-006.json` | Verbindung als Intelligenz |
| `meta-007` | exact_live_id | `cards/meta/meta-007.json` | Ramanujan-Ordnung |
| `sol-arch-003` | exact_live_id | `cards/solutions/sol-arch-003.json` | Nexus Garden card-crossing reference |
| `sol-cross-022` | exact_live_id | `cards/solutions/sol-cross-022.json` | Provenance + Freshness + Security |
| `sol-cross-054` | exact_live_id | `cards/solutions/sol-cross-054.json` | Math → Mechanic translation layer |
| `sol-cross-055` | exact_live_id | `cards/solutions/sol-cross-055.json` | G-MIND multi-agent research architecture |

## Historical Alias References

| Reference | Classification | Live Resolution | Notes |
|---|---|---|---|
| `sol-maya-001` | supported_alias | `meta-001` | Explicitly mapped in `index/ALIASES.json` |
| `sol-maya-002` | supported_alias | `meta-002` | Explicitly mapped in `index/ALIASES.json` |
| `sol-maya-003` | supported_alias | `meta-003` | Explicitly mapped in `index/ALIASES.json` |
| `sol-maya-004` | supported_alias | `meta-004` | Explicitly mapped in `index/ALIASES.json` |
| `sol-maya-005` | supported_alias | `meta-005` | Explicitly mapped in `index/ALIASES.json` |

## Phantom / Unresolved Architecture References

These names should not be treated as canonical IDs unless the live registry later adds them explicitly.

| Reference | Classification | Resolution Rule | Notes |
|---|---|---|---|
| `aicos-maya-01` | phantom_reference | no live resolution | Not present in `cards/**` or `index/ALIASES.json` |
| `aicos-maya-02` | phantom_reference | no live resolution | Not present in `cards/**` or `index/ALIASES.json` |
| `aicos-scout-01` | phantom_reference | no live resolution | Treat as prose-only architecture label |
| `aicos-auto-01` | phantom_reference | no live resolution | Treat as prose-only architecture label |
| `aicos-role-03` | phantom_reference | no live resolution | Treat as prose-only architecture label |

## Resolution Procedure

When an architecture document references an ID or label:

1. Check whether it exists exactly in `cards/**`.
2. If not, check `index/INDEX.json`.
3. If not, check `index/ALIASES.json` for an explicit mapping.
4. If still unresolved, classify it as `phantom_reference`.
5. Do not write new aliases, cards, or index entries just to satisfy the docs.

## Practical Guidance

- Use `docs/**` to understand architecture intent.
- Use cards and generated indexes to automate.
- Use this crosswalk whenever architecture prose and live registry naming diverge.
- Prefer exact live IDs in future docs additions.

## Scope Note

This crosswalk is deliberately documentation-only.
It does not modify registry data, aliases, schema, tooling, or runtime behavior.
