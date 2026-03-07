# PHASE4B_MEMORY_REVIEW_SURFACE

Stand: 2026-03-07
Status: Minimal Phase 4B memory-review surface

## 1. Purpose

This document describes the minimal Phase 4B surface added on top of the existing proposal-only arena and Phase 4A memory-candidate layer.

The goal is to let runtime memory candidates be reviewed, marked accepted, or marked rejected while keeping all review artifacts outside the registry and keeping accepted as a runtime-only review status.

## 2. Files

- `tools/memory-review-lib.js`
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `tools/verify-phase4b-memory-reviews.js`

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

## 4. Review State Model

Phase 4B defines the runtime review state vocabulary for memory candidates:
- `proposal_only`
- `reviewed`
- `accepted`
- `rejected`

Interpretation:
- candidate records remain stored as proposal-only artifacts
- current review state is derived from review records
- `accepted` means accepted for runtime review tracking only
- `accepted` does not mean registry promotion, registry write, or institutional memory write

## 5. Review Record Structure

Each review record includes:
- `review_id`
- `candidate_id`
- `source_run_id`
- `reviewed_at`
- `review_status`
- `review_rationale`
- `review_source`
- `reviewer_mode`
- optional `confidence`
- optional `notes`
- `audit_meta`

The review audit boundary stays explicit:
- `registry_mutation: false`
- `promotion_executed: false`

## 6. Candidate Read Model

When a memory candidate is read or listed, the runtime may expose:
- stored candidate fields from Phase 4A
- the derived `current_status`
- a compact `review_summary`

This allows review visibility without rewriting the underlying candidate record into a promoted or registry-backed artifact.

## 7. CLI Surface

```bash
node tools/arena.js list-memory-candidates
node tools/arena.js list-reviewable-candidates
node tools/arena.js review-memory-candidate <candidate_id> --review-status reviewed --review-rationale "manual runtime review"
node tools/arena.js list-memory-reviews
node tools/arena.js get-memory-review <review_id>
```

Behavior:
- list stored memory candidates with derived review status
- list candidates still reviewable in runtime terms
- create runtime-only review records
- inspect stored review records

## 8. HTTP Surface

```bash
node tools/arena-server.js
```

Available Phase 4B review endpoints:
- `GET /arena/memory-candidates/reviewable`
- `POST /arena/memory-candidates/:id/reviews`
- `GET /arena/memory-reviews`
- `GET /arena/memory-reviews/:id`

Existing Phase 4A candidate endpoints remain read-only.

## 9. Why This Is Still Phase 4B

This remains Phase 4B because it only adds:
- runtime review records
- derived runtime review states
- minimal review creation and inspection surfaces
- explicit audit boundaries for runtime-only acceptance

It does not add:
- registry mutation
- memory promotion into registry artifacts
- institutional memory writes
- auto-apply behavior
- judge depth
- specialist expansion
- provider integration
- Phase 5 autonomous memory workflows

## 10. Verification

Run:

```bash
node tools/verify-phase4b-memory-reviews.js
```

This checks:
- required Phase 4B files exist
- review artifacts are written outside registry files
- accepted remains runtime-only
- candidate linkage and source-run linkage remain intact
- HTTP review endpoints work
- registry files remain unchanged
