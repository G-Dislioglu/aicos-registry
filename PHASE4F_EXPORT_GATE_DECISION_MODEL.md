# PHASE4F_EXPORT_GATE_DECISION_MODEL

Stand: 2026-03-08
Status: Minimal Phase 4F export-gate decision surface

## 1. Purpose

Phase 4F adds a minimal runtime-only export-gate decision layer on top of the existing export-readiness and export-review lines.

The purpose is to make the current gate state explicit and readable without performing any export, canon write, or registry mutation.

## 2. Runtime boundary

Runtime storage remains outside the registry:
- run packets: `runtime/arena-runs/`
- audit records: `runtime/audit-records/`
- memory candidates: `runtime/memory-candidates/`
- memory reviews: `runtime/memory-reviews/`
- export reviews: `runtime/export-reviews/`

Registry remains unchanged:
- `cards/`
- `index/`
- `human/`
- `taxonomies/`

Phase 4F adds no new canon write surface.
It adds only a runtime-only decision derivation layer.

## 3. Gate signals

Phase 4F exposes at least:
- `export_gate_status`
- `export_gate_reasons`
- `export_gate_blockers`
- `gate_decision_summary`

These are derived from already existing runtime-only signals such as:
- `export_readiness_status`
- `current_export_review_status`
- `has_boundary`
- `has_review_record`
- `review_integrity`
- `review_coverage`
- `export_blockers`

## 4. Gate status vocabulary

Phase 4F derives:
- `export_blocked`
- `export_needs_human_decision`
- `export_gate_passed_runtime`

Interpretation:
- `export_blocked` means current runtime conditions still block a runtime gate pass
- `export_needs_human_decision` means the candidate is close enough that explicit human gate review is still pending or incomplete
- `export_gate_passed_runtime` means the runtime-only signals currently support a gate pass

This does not mean:
- exported
- promoted
- registry written
- canonized

## 5. Candidate read model

Candidate reads now remain proposal-only while additionally exposing:
- readiness status from Phase 4D
- export-review summary from Phase 4E
- gate-decision state from Phase 4F

This keeps the governance line explicit while preserving the original candidate artifact and all runtime boundaries.

## 6. CLI and HTTP read surface

No new write path is added for Phase 4F.
The existing candidate read surfaces now expose gate status:

CLI:
```bash
node tools/arena.js list-memory-candidates
node tools/arena.js get-memory-candidate <candidate_id>
```

HTTP:
- `GET /arena/memory-candidates`
- `GET /arena/memory-candidates/:id`

## 7. Verification

Run:

```bash
node tools/verify-phase4f-export-gate-decision-model.js
```

This checks:
- Phase 4A remains green
- Phase 4B remains green
- Phase 4C remains green
- Phase 4D remains green
- Phase 4E remains green
- gate decision remains runtime-only
- registry files remain unchanged
- export_gate_passed_runtime does not trigger mutation
