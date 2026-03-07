# PHASE2_MINIMAL_ARENA_SURFACE

Stand: 2026-03-07
Status: Minimal proposal-only arena surface for Phase 2

## 1. Purpose

This document describes the minimal arena surface added for Phase 2.

It is intentionally narrow.
It exists to provide a structurally correct proposal-only runtime baseline without introducing registry mutation, deeper intelligence layers, or Phase 3 audit/control depth.

## 2. Files

- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `tools/verify-phase2-arena.js`

## 3. Default Runtime Storage Boundary

Default trace output directory:
- `runtime/arena-runs/`

This directory is outside:
- `cards/`
- `index/`
- `human/`
- `taxonomies/`

Runtime traces are therefore separated from registry source-of-truth files.

## 4. Supported Structures

### Run Input

A minimal run may include:
- `question`
- target IDs
- registry filters
- shared evidence topic
- requested evidence sources

### Shared Evidence Pack

The shared evidence pack is placeholder-only in this phase.
It records:
- requested topic
- requested sources
- notes
- empty evidence items by default

### Scout Output

The scout output is deterministic and placeholder-only.
It records:
- candidate card IDs from registry-grounded lookup
- simple proposal hypotheses
- friction signals
- evidence-gap indication

### Observer Decision

The observer output is deterministic and proposal-only.
It records:
- continue vs escalate decision
- reasons
- risk signals
- `validated: false`
- `apply_allowed: false`
- `promotion_eligible: false`

### Trace Basis

Each stored run records:
- run metadata
- input snapshot
- shared evidence placeholder
- registry context snapshot
- scout output
- observer decision
- trace phase summary

## 5. CLI Surface

```bash
node tools/arena.js run --question "Registry-grounded probe" --q registry --type solution_proof
node tools/arena.js list-runs
node tools/arena.js get-run <run_id>
```

Supported behavior:
- create a proposal-only arena run
- persist the trace to local runtime storage
- list stored runs
- load stored runs by ID

## 6. HTTP Surface

```bash
node tools/arena-server.js
```

Available endpoints:
- `GET /arena/health`
- `GET /arena/runs`
- `POST /arena/runs`
- `GET /arena/runs/:id`

Behavior:
- uses built-in Node modules only
- persists runs only to local runtime storage
- does not write to registry files

## 7. Why This Is Still Phase 2

This remains Phase 2 because it only establishes:
- minimal runtime coordination
- a proposal-only packet basis
- shared evidence placeholder boundaries
- scout and observer placeholder outputs
- local runtime trace storage

It does not introduce:
- model-control behavior
- deep audit/control machinery
- memory promotion
- registry mutation
- validated promotion without `proof_ref` and gates

## 8. Verification

Run:

```bash
node tools/verify-phase2-arena.js
```

This checks:
- required Phase 2 files exist
- arena runs remain proposal-only
- trace output is stored outside registry files
- registry files are unchanged before and after verification
- HTTP arena endpoints work
