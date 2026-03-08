# PHASE4E_EXPORT_REVIEW_GATE_RECORDS

Stand: 2026-03-08
Status: Minimal Phase 4E export-review gate record surface

## 1. Purpose

Phase 4E adds a minimal runtime-only export-review layer on top of the Phase 4D export-readiness read model.

The purpose is to make export-readiness formally reviewable without performing any real export, canon mutation, or promotion.

## 2. Runtime boundary

Default runtime storage now includes:
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

Export-review records are runtime-only artifacts.
They are not canon and they do not mutate registry truth.

## 3. Export-review model

Each export-review record minimally includes:
- `export_review_id`
- `candidate_id`
- `source_run_id`
- `reviewed_at`
- `export_review_status`
- `export_review_rationale`
- `review_source`
- `reviewer_mode`
- `proof_notes`
- `gate_notes`
- `audit_meta`

The audit metadata explicitly preserves:
- runtime-only origin
- no registry mutation
- no export execution
- the candidate export-readiness snapshot at review time

## 4. Export-review status vocabulary

Phase 4E uses:
- `blocked`
- `needs_more_evidence`
- `approved_for_export_review`

Meaning:
- `blocked` maps to candidates whose export-readiness still resolves to `not_ready`
- `needs_more_evidence` maps to candidates whose export-readiness still exposes blockers
- `approved_for_export_review` maps to candidates currently read as `ready_for_export_review`

This does not mean:
- exported
- promoted
- registry written
- canonized

## 5. Candidate read model

Candidate reads now remain proposal-only while additionally exposing:
- `export_readiness_status`
- `export_blockers`
- `current_export_review_status`
- `export_review_summary`

This keeps readiness and formal export-review records visible without changing the stored candidate artifact itself.

## 6. Minimal runtime behavior

Phase 4E provides:
- create export-review record for a memory candidate
- list export-review records
- get export-review record

Creation rule:
- the runtime reads the current candidate export-readiness
- the export-review status is derived from that readiness state
- the export-review record is then stored as a separate runtime artifact

## 7. CLI surface

```bash
node tools/arena.js export-review-memory-candidate <candidate_id> --export-review-rationale TEXT [--review-source SOURCE] [--reviewer-mode MODE] [--proof-note NOTE] [--gate-note NOTE] [--export-review-dir DIR] [--memory-dir DIR] [--memory-review-dir DIR] [--json]
node tools/arena.js list-export-reviews [--export-review-dir DIR] [--json]
node tools/arena.js get-export-review <export_review_id> [--export-review-dir DIR] [--json]
```

## 8. HTTP surface

Available endpoints:
- `POST /arena/memory-candidates/:id/export-reviews`
- `GET /arena/export-reviews`
- `GET /arena/export-reviews/:id`

Behavior:
- reads only runtime candidate and review state
- writes only runtime export-review records
- performs no registry mutation
- performs no canon export

## 9. Verification

Run:

```bash
node tools/verify-phase4e-export-review-gate-records.js
```

This checks:
- Phase 4A remains green
- Phase 4B remains green
- Phase 4C remains green
- Phase 4D remains green
- export-review records stay runtime-only
- approved-for-export-review does not trigger mutation
- registry files remain unchanged
