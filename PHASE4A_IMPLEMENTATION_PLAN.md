# PHASE4A_IMPLEMENTATION_PLAN

Stand: 2026-03-07
Status: Phase 4A implementation plan

## 1. Purpose

This document defines the minimal implementation scope for Phase 4A: Minimal Memory Proposal Layer.

The goal is to extend the current proposal-only arena with a small, audit-friendly memory-candidate layer that can emit proposal-only memory candidate records without introducing promotion, institutional memory writes, or registry mutation.

## 2. Scope Boundaries

In scope:
- a minimal proposal-only memory-candidate data model
- local memory-candidate records stored outside registry files
- clean linkage from a source arena run to generated memory candidates
- explicit non-promoted state on every memory candidate
- small CLI and HTTP additions only where they match the existing arena pattern
- dedicated Phase 4A verification and compact documentation

Out of scope:
- any write path into `cards/`, `index/`, `human/`, or `taxonomies/`
- any memory promotion flow
- any automatic persist into institutional memory
- any auto-apply behavior
- validated outputs without `proof_ref` and gates
- judge or specialist-depth expansion
- provider integration
- benchmark expansion
- UI work
- changes to `MODULE_MAP_LOCKED.md`, `ARCHITECTURE_MVP.md`, `MVP_PHASE_PLAN.md`, or `REGISTRY_PHASE1_READINESS.md`

## 3. Minimal Repo Mapping

Phase 4A extends the current runtime foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `tools/verify-phase3-audit-control.js`

Minimal new Phase 4A mapping:
- `M10`: proposal-only memory candidate records and non-promoted candidate state
- `M15`: runtime coordination updates in arena CLI/HTTP/runtime
- `M16`: audit alignment between run packets, audit records, and memory-candidate records

## 4. Minimal Build Strategy

To stay inside Phase 4A, build only:

1. a reusable local memory-proposal library in `tools/memory-proposal-lib.js`
2. a small extension of arena packets to optionally generate proposal-only memory candidates
3. proposal-only memory-candidate persistence outside registry files
4. minimal CLI support to inspect stored memory candidates
5. minimal HTTP support to inspect stored memory candidates
6. a dedicated Phase 4A verification script
7. this plan and a Phase 4A surface description document

Default local runtime storage should remain outside the registry:
- run packets: `runtime/arena-runs/`
- audit records: `runtime/audit-records/`
- memory candidates: `runtime/memory-candidates/`

## 5. Planned Behavior

### Memory Proposal Basis

A run may optionally request memory-candidate generation.
If enabled, the runtime may emit one or more small proposal-only memory candidates that capture:
- `candidate_id`
- `source_run_id`
- `created_at`
- `status`
- `promoted`
- `candidate_type`
- `rationale`
- `confidence`
- `priority`
- optional `tags` and `notes`
- minimal audit/meta fields aligned with the Phase 3 line

### Non-Promotion Boundary

Every memory candidate must remain explicit proposal-only state:
- `status = proposal_only`
- `promoted = false`
- no write path to registry files
- no write path to institutional memory
- no automatic transition into validated or promoted memory

## 6. Files to Create or Update

Create:
- `PHASE4A_IMPLEMENTATION_PLAN.md`
- `PHASE4A_MEMORY_PROPOSAL_SURFACE.md`
- `tools/memory-proposal-lib.js`
- `tools/verify-phase4a-memory-proposals.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`

## 7. Verification Goals

Phase 4A is locally satisfied if:
- proposal-only remains intact
- memory candidates are stored outside registry files
- every memory candidate remains non-promoted
- source run linkage is present and readable
- no registry files are changed before and after verification
- no promotion logic or broader Phase 4B/5 drift is introduced
- CLI and HTTP surfaces expose only the minimal memory-proposal additions
