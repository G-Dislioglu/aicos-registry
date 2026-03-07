# PHASE4B_IMPLEMENTATION_PLAN

Stand: 2026-03-07
Status: Phase 4B implementation plan

## 1. Purpose

This document defines the minimal implementation scope for Phase 4B: Review/Acceptance Preparation for Memory Proposals.

The goal is to add a small review layer for Phase 4A memory candidates so they can be reviewed, marked accepted, or marked rejected as runtime-only review artifacts without introducing registry mutation, institutional memory writes, or a promotion pipeline.

## 2. Scope Boundaries

In scope:
- explicit runtime review states for memory candidates
- review records stored outside registry files
- preserved linkage between candidate, source run, and review record
- minimal CLI and HTTP review surfaces in the existing arena pattern
- auditable runtime-only acceptance and rejection markers
- dedicated Phase 4B verification and compact documentation

Out of scope:
- any write path into `cards/`, `index/`, `human/`, or `taxonomies/`
- any promotion into registry or institutional memory
- any automatic apply behavior
- any hidden semantic upgrade from accepted review state into production state
- judge or specialist-depth expansion
- provider integration
- benchmark expansion
- UI work
- broad arena refactors beyond the minimal review surface

## 3. Minimal Repo Mapping

Phase 4B extends the current runtime foundation:
- `tools/memory-proposal-lib.js`
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `tools/verify-phase4a-memory-proposals.js`

Minimal new Phase 4B mapping:
- `M10`: runtime memory candidate state progression for review-only handling
- `M15`: minimal CLI/HTTP/runtime coordination for review records
- `M16`: audit-friendly linkage between run packets, candidates, and review records

## 4. Minimal Build Strategy

To stay inside Phase 4B, build only:

1. a reusable local review library in `tools/memory-review-lib.js`
2. a new runtime review record store outside the registry
3. derived candidate review status without rewriting registry files
4. minimal CLI support to list reviewable candidates and review records
5. minimal HTTP support to list and create review records
6. a dedicated Phase 4B verification script
7. this plan and a Phase 4B surface description document

Default local runtime storage should remain outside the registry:
- run packets: `runtime/arena-runs/`
- audit records: `runtime/audit-records/`
- memory candidates: `runtime/memory-candidates/`
- memory reviews: `runtime/memory-reviews/`

## 5. Planned Behavior

### Review State Basis

A memory candidate remains proposal-only in its stored candidate record.
Phase 4B adds review records that can express the current runtime review state as one of:
- `proposal_only`
- `reviewed`
- `accepted`
- `rejected`

In Phase 4B:
- `proposal_only` is the default candidate state before any review record exists
- `reviewed`, `accepted`, and `rejected` are review outcomes recorded outside the registry
- `accepted` means accepted as a runtime review artifact only
- `accepted` does not mean promoted, applied, or written into the registry

### Review Record Minimum

Each review record should capture:
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

The review audit boundary must stay explicit:
- `registry_mutation = false`
- `promotion_executed = false`

## 6. Files to Create or Update

Create:
- `PHASE4B_IMPLEMENTATION_PLAN.md`
- `PHASE4B_MEMORY_REVIEW_SURFACE.md`
- `tools/memory-review-lib.js`
- `tools/verify-phase4b-memory-reviews.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`

## 7. Verification Goals

Phase 4B is locally satisfied if:
- registry files remain unchanged
- review artifacts are stored outside registry files
- accepted remains runtime-only and non-promoted
- no candidate review writes into the registry
- candidate and source-run linkage stay readable
- CLI and HTTP surfaces expose only the minimal review additions
- no broader Phase 5 drift is introduced
