# AICOS Registry

AICOS Registry is a **JSON-based knowledge database** for:

- **Error patterns** you repeatedly encounter (symptoms, repro, root cause, guardrails)
- **Proven solutions** that fix or mitigate those patterns (steps, tradeoffs, rollback)

The goal is to make troubleshooting and agent workflows deterministic: find a matching error card, follow linked solution cards, and record evidence.

## Repository Structure

- `cards/errors/`
  - Error pattern cards (`type: error_pattern`)
- `cards/solutions/`
  - Solution proof cards (`type: solution_proof`)
- `index/INDEX.json`
  - Lightweight registry index for fast scanning/searching
- `human/REGISTRY.md`
  - Human-readable overview table

## How agents should use this registry

- **Start with `index/INDEX.json`**
  - Filter by `domain`, `tags`, `status`, and `token`
- **Open the referenced card JSON**
  - `cards/errors/<id>.json` or `cards/solutions/<id>.json`
- **Follow links**
  - Error cards link to solution cards via `links.fixes`
  - Solution cards link back via `links.causes`
- **Record evidence and guardrails**
  - Use `evidence.signals` to confirm you’re seeing the same failure mode
  - Use `guardrails` / `prevent_tests` to prevent regressions

## Authoring rules (practical)

- **IDs are stable** and used as primary keys (e.g. `err-...`, `sol-...`).
- **`token` is a searchable slug** that should be globally unique.
- **Keep cards JSON-valid** (strict JSON, double quotes, no trailing commas).
- **Always update `index/INDEX.json`** when adding/removing cards.
