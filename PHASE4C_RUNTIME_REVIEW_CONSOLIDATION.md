# PHASE4C_RUNTIME_REVIEW_CONSOLIDATION

Stand: 2026-03-08
Status: Minimal Phase 4C runtime review consolidation surface

## 1. Purpose

This document describes the minimal Phase 4C consolidation added on top of the existing Phase 4A proposal-only memory candidate layer and the Phase 4B runtime review layer.

The goal is to make runtime review-state reading explicit and stable before any later export or canon-facing work, while keeping all artifacts outside the registry and keeping stored candidate files proposal-only.

## 2. Files

- `tools/memory-review-lib.js`
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `tools/verify-phase4c-runtime-review-consolidation.js`

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

## 4. Consolidated Review-State Rule

Phase 4C makes the runtime read-model rule explicit:
- only valid review decision records participate in status derivation
- review records are ordered by `reviewed_at`
- ties are broken by `review_id`
- the latest valid review wins

The runtime review vocabulary remains:
- `proposal_only`
- `reviewed`
- `accepted`
- `rejected`

Interpretation:
- stored candidate files remain `proposal_only`
- `current_status` is read-model state, not stored candidate mutation
- `accepted` and `rejected` remain runtime-only terminal review states
- `accepted` does not mean registry promotion, registry write, or institutional memory write

## 5. Candidate Read Model

When a memory candidate is read or listed, the runtime may expose:
- stored candidate fields from Phase 4A
- the derived `current_status`
- a `review_summary` carrying derivation metadata and counts
- a compact `status_derivation` block

This keeps the derivation explicit while preserving the underlying proposal-only candidate artifact.

## 6. Review Governance

Minimal Phase 4C runtime review governance:
- `proposal_only` and `reviewed` remain reviewable
- `accepted` and `rejected` are terminal
- terminal candidates reject further review writes
- candidate files and review files remain separate artifacts

## 7. CLI and HTTP Surface

CLI remains minimal:

```bash
node tools/arena.js list-memory-candidates
node tools/arena.js list-reviewable-candidates
node tools/arena.js get-memory-candidate <candidate_id>
node tools/arena.js review-memory-candidate <candidate_id> --review-status reviewed --review-rationale "manual runtime review"
node tools/arena.js list-memory-reviews
```

HTTP remains minimal:
- `GET /arena/memory-candidates`
- `GET /arena/memory-candidates/reviewable`
- `GET /arena/memory-candidates/:id`
- `POST /arena/memory-candidates/:id/reviews`
- `GET /arena/memory-reviews`
- `GET /arena/memory-reviews/:id`

## 8. Why This Is Still Phase 4C

This remains a conservative consolidation step because it only adds:
- explicit review-state derivation semantics
- terminal review consistency
- slightly clearer runtime read models
- a dedicated verification path

It does not add:
- registry mutation
- export or promotion logic
- institutional memory writes
- provider integration
- judge or specialist expansion
- MEC-facing work

## 9. Verification

Run:

```bash
node tools/verify-phase4c-runtime-review-consolidation.js
```

This checks:
- Phase 4A verification still passes
- Phase 4B verification still passes
- registry files remain unchanged
- candidate and review files stay separated
- current runtime status is derived consistently
- terminal review states reject further writes
- no hidden export or promotion logic is introduced
