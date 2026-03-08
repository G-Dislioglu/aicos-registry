# MEC_PHASE2_IMPLEMENTATION_PLAN

Stand: 2026-03-08
Status: Phase 2 implementation plan

## 1. Purpose

This document defines the minimal MEC Sidecar MVP Phase 2 implementation scope.

Phase 2 adds a runtime-only candidate distillation foundation outside the registry.
It introduces a small candidate layer for manual or semi-manual candidate creation while keeping MEC as a sidecar and preserving proposal-only defaults.

## 2. Scope Boundaries

In scope:
- runtime-only MEC candidate storage under `runtime/candidates/`
- minimal candidate schemas for:
  - `invariant_candidate`
  - `boundary_candidate`
  - `counterexample_candidate`
  - `curiosity_candidate`
- a small MEC candidate library for:
  - create candidate
  - create invariant candidate with linked boundary candidate
  - list candidates
  - get candidate
- source linking to MEC events and optional registry cards
- small CLI create/list/get surface
- small HTTP create/list/get surface in the existing arena-server pattern
- dedicated verification and compact documentation

Out of scope:
- registry mutation
- canon export logic
- promotion logic
- MEC review integration beyond Phase 2 needs
- judgment/tradeoff/policy logic
- variant lab logic
- broad arena refactor
- AICOS mainline expansion in this block
- large taxonomy changes

## 3. Locked Architectural Anchors

Phase 2 follows:
- `MEC_ARCHITECTURE_LOCKED.md`
- `MEC_MVP_PHASE_PLAN.md`

Authoritative constraints:
- MEC remains a sidecar subsystem
- runtime artifacts remain outside `cards/`, `index/`, `human/`, and `taxonomies/`
- proposal-only remains the default runtime truth
- no silent canon mutation is allowed

## 4. Minimal Repo Mapping

Phase 2 mainly covers:
- `MEC-03 Candidate Forge`
- a narrow portion of `OP-01 DISTILL`
- a narrow portion of `OP-02 BOUND`
- runtime storage discipline from the locked MEC architecture

This is still pre-review and pre-export work.

## 5. Planned Runtime Behavior

### Candidate runtime path

Use:
- `runtime/candidates/`

No candidate artifacts are written to registry folders.

### Candidate creation model

Phase 2 supports manual or semi-manual candidate creation.

For `invariant_candidate`:
- `principle` is required
- `mechanism` is required
- at least one `source_event_id` is required
- a linked `boundary_candidate` is created in the same runtime flow
- invariant candidates remain `proposal_only`

For `boundary_candidate`:
- `linked_candidate_id` is required
- boundary conditions remain runtime-only

For `counterexample_candidate`:
- `refutes_candidate_id` is required
- the case remains proposal-only and runtime-only

For `curiosity_candidate`:
- `open_question` and `domain` are required
- it remains runtime-only and does not auto-resolve

## 6. Files to Create or Update

Create:
- `MEC_PHASE2_IMPLEMENTATION_PLAN.md`
- `MEC_PHASE2_CANDIDATE_DISTILLATION.md`
- `tools/mec-candidate-lib.js`
- `tools/verify-mec-phase2-candidates.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`

## 7. Verification Goals

Phase 2 is locally satisfied if:
- MEC Phase 1 remains green
- AICOS Phase 4A through 4D remain green or are not disturbed
- candidate files are written only under `runtime/candidates/`
- create/list/get work locally
- invariant candidate creation produces a linked boundary candidate
- source refs to events and optional cards are preserved
- no registry files are changed
- no canon or export logic is executed
