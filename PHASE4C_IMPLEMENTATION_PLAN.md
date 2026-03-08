# PHASE4C_IMPLEMENTATION_PLAN

Stand: 2026-03-08
Status: Phase 4C implementation plan

## 1. Purpose

This document defines the minimal implementation scope for Phase 4C: Runtime Review Consolidation & Schema Cleanup.

The goal is to consolidate the existing Phase 4A/4B runtime memory proposal and review line by making review-state derivation explicit, tightening minimal runtime review governance, and cleaning up the read model without introducing promotion, registry mutation, or export logic.

## 2. Scope Boundaries

In scope:
- explicit and stable review-state derivation rules
- minimal schema/version clarity for review read-model semantics
- clearer candidate and review read models for runtime inspection
- minimal runtime review governance for terminal review states
- small CLI and HTTP read-surface improvements only where they directly support consolidation
- dedicated Phase 4C verification and compact documentation

Out of scope:
- any write path into `cards/`, `index/`, `human/`, or `taxonomies/`
- any registry mutation
- any promotion or export pipeline
- any automatic apply behavior
- institutional memory writes
- judge or specialist-depth expansion
- provider integration
- broad arena refactors
- MEC expansion
- new large taxonomies

## 3. Minimal Repo Mapping

Phase 4C consolidates the current runtime foundation:
- `tools/memory-review-lib.js`
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `tools/verify-phase4a-memory-proposals.js`
- `tools/verify-phase4b-memory-reviews.js`

Minimal Phase 4C mapping:
- `M10`: runtime candidate review-state consolidation
- `M15`: minimal read-surface clarity for CLI/HTTP runtime inspection
- `M16`: stable runtime audit/read-model semantics without canon writes

## 4. Minimal Build Strategy

To stay inside Phase 4C, build only:

1. explicit review-state derivation helpers in the runtime review library
2. minimal terminal-state review governance for accepted and rejected candidates
3. clearer derived candidate and review read models without rewriting stored candidate files
4. small CLI and HTTP behavior cleanup directly tied to review consolidation
5. a dedicated Phase 4C verification script
6. this plan and a compact Phase 4C consolidation surface document

Runtime storage remains outside the registry:
- run packets: `runtime/arena-runs/`
- audit records: `runtime/audit-records/`
- memory candidates: `runtime/memory-candidates/`
- memory reviews: `runtime/memory-reviews/`

## 5. Planned Behavior

### Review-State Derivation

A memory candidate remains stored as a proposal-only candidate record.
The current runtime review state is derived from review records using an explicit rule:
- only valid review records participate in status derivation
- records are ordered by `reviewed_at`
- ties are broken by `review_id`
- the latest valid review wins

The runtime review vocabulary remains:
- `proposal_only`
- `reviewed`
- `accepted`
- `rejected`

### Minimal Runtime Governance

In Phase 4C:
- `proposal_only` and `reviewed` remain reviewable states
- `accepted` and `rejected` are terminal runtime review states
- terminal runtime review states remain runtime-only and non-promoted
- candidate files remain separate from review files
- current status remains derived in the read model instead of mutating stored candidate files

## 6. Files to Create or Update

Create:
- `PHASE4C_IMPLEMENTATION_PLAN.md`
- `PHASE4C_RUNTIME_REVIEW_CONSOLIDATION.md`
- `tools/verify-phase4c-runtime-review-consolidation.js`

Update:
- `tools/memory-review-lib.js`
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`

## 7. Verification Goals

Phase 4C is locally satisfied if:
- Phase 4A remains green
- Phase 4B remains green
- registry files remain unchanged
- candidate files and review files remain separate
- stored candidates remain proposal-only artifacts
- current runtime status is derived consistently and explicitly
- terminal review states are handled consistently
- no promotion or export logic is introduced
