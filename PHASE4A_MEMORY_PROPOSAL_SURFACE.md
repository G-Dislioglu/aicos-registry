# PHASE4A_MEMORY_PROPOSAL_SURFACE

Stand: 2026-03-07
Status: Minimal Phase 4A memory-proposal surface

## 1. Purpose

This document describes the minimal Phase 4A surface added on top of the existing proposal-only arena, audit, and model-control foundation.

The goal is to let runs emit small memory-candidate records for human review while keeping all candidate records proposal-only and outside the registry.

## 2. Files

- `tools/memory-proposal-lib.js`
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `tools/verify-phase4a-memory-proposals.js`

## 3. Runtime Boundary

Runtime, audit, and memory artifacts remain outside registry files.
Default directories:

- run packets: `runtime/arena-runs/`
- audit records: `runtime/audit-records/`
- memory candidates: `runtime/memory-candidates/`

These are separate from:
- `cards/`
- `index/`
- `human/`
- `taxonomies/`

## 4. Memory Candidate Structure

Each stored memory candidate remains proposal-only and non-promoted.
The minimal record includes:
- `candidate_id`
- `source_run_id`
- `created_at`
- `status`
- `promoted`
- `candidate_type`
- `rationale`
- `confidence`
- `priority`
- optional `tags`
- optional `notes`
- `audit_meta`

The Phase 4A implementation may generate candidates such as:
- registry-grounded observations
- evidence-gap follow-up proposals

## 5. Run / Audit Alignment

If memory proposals are enabled on a run:
- the run packet records a memory-proposal summary
- the audit record records a matching memory-proposal summary
- each stored memory candidate links back to the source run with `source_run_id`

No candidate is promoted automatically.
No candidate writes into the registry.

## 6. CLI Surface

```bash
node tools/arena.js run --question "Registry-grounded probe" --memory-proposals
node tools/arena.js list-runs
node tools/arena.js get-run <run_id>
node tools/arena.js get-audit <run_id>
node tools/arena.js list-memory-candidates
node tools/arena.js get-memory-candidate <candidate_id>
```

Behavior:
- create proposal-only runs
- optionally emit proposal-only memory candidates
- inspect stored runs
- inspect audit records
- inspect stored memory candidates

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
- `GET /arena/memory-candidates`
- `GET /arena/memory-candidates/:id`

## 8. Why This Is Still Phase 4A

This remains Phase 4A because it only adds:
- proposal-only memory-candidate records
- explicit source-run linkage
- minimal storage and inspection surfaces
- audit alignment for memory proposals

It does not add:
- memory promotion
- institutional memory writes
- registry mutation
- judge depth
- specialist expansion
- provider integration
- benchmark systems
- broader autonomous memory workflows

## 9. Verification

Run:

```bash
node tools/verify-phase4a-memory-proposals.js
```

This checks:
- required Phase 4A files exist
- proposal-only remains intact
- memory candidates are written outside registry files
- memory candidates remain `proposal_only` and `promoted: false`
- source-run linkage is preserved
- HTTP memory-candidate endpoints work
- registry files remain unchanged
