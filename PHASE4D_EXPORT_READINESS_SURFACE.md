# PHASE4D_EXPORT_READINESS_SURFACE

Stand: 2026-03-08
Status: Minimal Phase 4D export-readiness preparation surface

## 1. Purpose

This document describes the minimal Phase 4D surface added on top of the existing Phase 4A proposal-only candidate layer, the Phase 4B runtime review layer, and the Phase 4C review consolidation layer.

The goal is to prepare an explicit runtime-only export-readiness read model without introducing any real export, promotion, or canon mutation.

## 2. Files

- `tools/memory-export-readiness-lib.js`
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/verify-phase4d-export-readiness.js`

## 3. Runtime Boundary

Runtime, audit, candidate, and review artifacts remain outside registry files.
Default directories:

- run packets: `runtime/arena-runs/`
- audit records: `runtime/audit-records/`
- memory candidates: `runtime/memory-candidates/`
- memory reviews: `runtime/memory-reviews/`

These remain separate from:
- `cards/`
- `index/`
- `human/`
- `taxonomies/`

## 4. Export-Readiness Signals

Phase 4D adds a runtime-only readiness summary to candidate reads.
Minimal signals include:
- `has_boundary`
- `has_review_record`
- `terminal_runtime_status`
- `proof_readiness`
- `gate_readiness`
- `review_coverage`
- `review_integrity`
- `contradiction_pressure`
- `export_blockers`
- `export_readiness_status`

These signals are read-model signals only.
They do not mutate the stored candidate artifact.

## 5. Readiness Status Vocabulary

Phase 4D uses:
- `not_ready`
- `needs_more_evidence`
- `ready_for_export_review`

Interpretation:
- `not_ready` means minimum readiness conditions are not yet met
- `needs_more_evidence` means the candidate has enough runtime review structure to be considered further, but still has blockers
- `ready_for_export_review` means only that the runtime read model sees no current blockers for a future export review discussion

It does not mean:
- exported
- promoted
- written into the registry
- canonized

## 6. Candidate Read Model

When a memory candidate is read or listed, the runtime may now expose:
- stored candidate fields from Phase 4A
- the derived review-state fields from Phase 4B/4C
- the Phase 4D `export_readiness_status`
- the Phase 4D `export_blockers`
- a compact nested `export_readiness` summary

This keeps the export-readiness preparation explicit while preserving the proposal-only candidate artifact and runtime-only review boundary.

## 7. CLI and HTTP Surface

CLI remains minimal:

```bash
node tools/arena.js list-memory-candidates
node tools/arena.js get-memory-candidate <candidate_id>
```

Existing HTTP candidate endpoints remain read-only and now expose readiness preparation fields through the existing candidate payloads:
- `GET /arena/memory-candidates`
- `GET /arena/memory-candidates/:id`

## 8. Why This Is Still Phase 4D

This remains a conservative preparation step because it only adds:
- runtime-only readiness evaluation
- explicit blockers and readiness status vocabulary
- no write path to canon
- no export execution

It does not add:
- registry mutation
- export execution
- promotion pipeline
- institutional memory writes
- provider integration
- judge or specialist expansion
- MEC-facing work

## 9. Verification

Run:

```bash
node tools/verify-phase4d-export-readiness.js
```

This checks:
- Phase 4A remains green
- Phase 4B remains green
- Phase 4C remains green
- registry files remain unchanged
- readiness evaluation stays runtime-only
- ready-for-export-review does not cause mutation
- candidate and review artifacts remain separate
