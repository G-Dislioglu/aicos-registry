# PHASE4E_IMPLEMENTATION_PLAN

Stand: 2026-03-08
Status: Phase 4E implementation plan

## 1. Purpose

This document defines the minimal implementation scope for Phase 4E: Export Review Gate Records.

Phase 4E adds a runtime-only export-review layer on top of the existing Phase 4D export-readiness preparation. The goal is to make export-readiness formally reviewable without introducing any real export, canon write, promotion path, or registry mutation.

## 2. Scope Boundaries

In scope:
- runtime-only export-review storage under `runtime/export-reviews/`
- a minimal export-review record schema
- minimal create/list/get export-review runtime logic
- candidate read-model enrichment with export-review summary fields
- small CLI and HTTP surfaces directly related to export review
- dedicated verification and compact documentation

Out of scope:
- any registry mutation
- any canon write
- any real export pipeline
- any promotion logic
- institutional memory writes
- judge or specialist expansion
- provider integration
- broad arena refactor
- MEC expansion in this block
- large new taxonomies

## 3. Reference Language

M01-M17 remains the reference language.
Phase 4E fits conservatively inside the existing runtime governance and read-model line by extending:
- runtime proposal-only candidate handling
- runtime review layering
- runtime export-readiness preparation
- runtime audit discipline

## 4. Minimal Repo Mapping

Phase 4E mainly extends:
- `M10`: runtime candidate evaluation and review layering
- `M15`: explicit read surfaces for runtime governance state
- `M16`: audit-safe runtime boundaries before any future canon export gate exists

## 5. Planned Runtime Behavior

### Export-review storage

Use:
- `runtime/export-reviews/`

No export-review artifacts are written into:
- `cards/`
- `index/`
- `human/`
- `taxonomies/`

### Export-review record model

Each runtime export-review record should minimally carry:
- `export_review_id`
- `candidate_id`
- `source_run_id`
- `reviewed_at`
- `export_review_status`
- `export_review_rationale`
- `review_source`
- `reviewer_mode`
- optional proof and gate notes
- `audit_meta`

### Export-review status vocabulary

Phase 4E uses:
- `blocked`
- `needs_more_evidence`
- `approved_for_export_review`

Interpretation:
- `approved_for_export_review` means only that the runtime export-review layer sees the candidate as ready for a future export discussion
- it does not mean exported, promoted, canonized, or written into the registry

## 6. Files to Create or Update

Create:
- `PHASE4E_IMPLEMENTATION_PLAN.md`
- `PHASE4E_EXPORT_REVIEW_GATE_RECORDS.md`
- `tools/memory-export-review-lib.js`
- `tools/verify-phase4e-export-review-gate-records.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`

## 7. Verification Goals

Phase 4E is locally satisfied if:
- Phase 4A remains green
- Phase 4B remains green
- Phase 4C remains green
- Phase 4D remains green
- registry files remain unchanged
- export-review records are written only under `runtime/export-reviews/`
- export-review remains runtime-only
- approved-for-export-review does not execute export, promotion, or registry mutation
- candidate files remain proposal-only artifacts
