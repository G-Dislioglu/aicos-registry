# PHASE3_AUDIT_MODEL_CONTROL_SURFACE

Stand: 2026-03-07
Status: Minimal Phase 3 auditability and model-control surface

## 1. Purpose

This document describes the minimal Phase 3 surface added on top of the Phase 2 proposal-only arena foundation.

The Phase 3 goal is not to broaden intelligence.
It is to make the current arena runtime more reviewable and more controllable while keeping registry truth untouched.

## 2. Files

- `tools/model-control-lib.js`
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `tools/verify-phase3-audit-control.js`

## 3. Runtime and Audit Boundary

Runtime and audit artifacts remain outside registry files.
Default directories:

- run packets: `runtime/arena-runs/`
- audit records: `runtime/audit-records/`

These are separate from:
- `cards/`
- `index/`
- `human/`
- `taxonomies/`

## 4. Audit / Trace Additions

Each run packet now exposes a clearer audit-oriented structure for:
- run metadata
- selected model-control profile
- proposal-only boundary
- registry context source
- evidence placeholder state
- phase timestamps and summary markers

Each run also produces a separate audit record that captures:
- run metadata
- decision boundary
- model/profile snapshot
- proposal-only status
- registry context source summary
- evidence placeholder state
- phase summary

## 5. Minimal Model-Control Surface

The model-control layer is local and structural only.
It provides small predefined profiles such as:
- `default`
- `low_cost`
- `review_strict`

Each profile records:
- description
- selection strategy
- role bindings
- budget posture
- whether adaptive routing is enabled

This does not introduce:
- real provider integration
- benchmark systems
- deep routing logic
- automatic selection expansion

## 6. CLI Surface

```bash
node tools/arena.js run --question "Registry-grounded probe" --profile review_strict
node tools/arena.js list-runs
node tools/arena.js get-run <run_id>
node tools/arena.js get-audit <run_id>
node tools/arena.js list-profiles
```

Behavior:
- create proposal-only runs with an explicit control profile
- inspect stored runs
- inspect audit records
- inspect available model-control profiles

## 7. HTTP Surface

```bash
node tools/arena-server.js
```

Available endpoints:
- `GET /arena/health`
- `GET /arena/runs`
- `POST /arena/runs`
- `GET /arena/runs/:id`
- `GET /arena/audit/:id`
- `GET /arena/profiles`

## 8. Why This Is Still Phase 3

This remains Phase 3 because it only adds:
- clearer auditability
- local model-control structure
- controlled runtime/audit coordination

It does not add:
- specialist-role expansion
- distillation or judge depth
- memory promotion
- registry mutation
- validated promotion without `proof_ref` and gates
- Phase 4 intelligence layers

## 9. Verification

Run:

```bash
node tools/verify-phase3-audit-control.js
```

This checks:
- required Phase 3 files exist
- proposal-only remains intact
- audit records and run packets are stored outside registry files
- local profiles are available and selectable
- HTTP audit/profile endpoints work
- registry files remain unchanged
