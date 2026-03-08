# PHASE4D_IMPLEMENTATION_PLAN

Stand: 2026-03-08
Status: Phase 4D implementation plan

## 1. Purpose

This document defines the minimal implementation scope for Phase 4D: Export Readiness Gate Prep.

The goal is to add a small runtime-only export-readiness preparation layer on top of the existing Phase 4A/4B/4C memory candidate and review line, without introducing export execution, promotion, registry mutation, or canon writes.

## 2. Scope Boundaries

In scope:
- explicit runtime-only export-readiness evaluation
- minimal proof/gate readiness signals in the candidate read model
- minimal boundary, review coverage, and contradiction-pressure signals
- derived export-readiness statuses for runtime inspection
- small CLI and existing HTTP read-surface improvements where they directly expose readiness preparation
- dedicated Phase 4D verification and compact documentation

Out of scope:
- any write path into `cards/`, `index/`, `human/`, or `taxonomies/`
- any registry mutation
- any real export or canon write
- any promotion pipeline
- institutional memory writes
- provider integration
- judge or specialist-depth expansion
- broad arena refactors
- MEC expansion
- new large taxonomies

## 3. Minimal Repo Mapping

Phase 4D extends the current runtime foundation:
- `tools/memory-review-lib.js`
- `tools/memory-export-readiness-lib.js`
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/verify-phase4a-memory-proposals.js`
- `tools/verify-phase4b-memory-reviews.js`
- `tools/verify-phase4c-runtime-review-consolidation.js`

Minimal Phase 4D mapping:
- `M10`: runtime candidate export-readiness preparation
- `M15`: minimal read-surface clarity for readiness inspection
- `M16`: runtime audit/read-model boundaries preserved while preparing later export review

## 4. Minimal Build Strategy

To stay inside Phase 4D, build only:

1. a reusable runtime-only export-readiness helper
2. minimal derived readiness signals on top of the existing candidate and review read model
3. no change to stored candidate proposal-only semantics
4. no change to runtime-only acceptance semantics
5. small CLI read output cleanup for readiness visibility
6. a dedicated Phase 4D verification script
7. this plan and a compact Phase 4D surface description document

Runtime storage remains outside the registry:
- run packets: `runtime/arena-runs/`
- audit records: `runtime/audit-records/`
- memory candidates: `runtime/memory-candidates/`
- memory reviews: `runtime/memory-reviews/`

## 5. Planned Behavior

### Export Readiness Preparation

A memory candidate remains stored as a proposal-only candidate artifact.
Phase 4D adds a runtime-only export-readiness evaluation that may expose:
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

### Readiness Status Vocabulary

Phase 4D uses the following derived runtime-only readiness statuses:
- `not_ready`
- `needs_more_evidence`
- `ready_for_export_review`

Interpretation:
- `ready_for_export_review` means only that the runtime read model sees a candidate as ready for a later export review step
- it does not mean exported, promoted, canonized, or written into the registry

## 6. Files to Create or Update

Create:
- `PHASE4D_IMPLEMENTATION_PLAN.md`
- `PHASE4D_EXPORT_READINESS_SURFACE.md`
- `tools/memory-export-readiness-lib.js`
- `tools/verify-phase4d-export-readiness.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`

## 7. Verification Goals

Phase 4D is locally satisfied if:
- Phase 4A remains green
- Phase 4B remains green
- Phase 4C remains green
- registry files remain unchanged
- export-readiness evaluation remains runtime-only
- candidate files remain proposal-only artifacts
- ready-for-export-review does not execute export, promotion, or registry mutation
- existing candidate/review separation remains intact
