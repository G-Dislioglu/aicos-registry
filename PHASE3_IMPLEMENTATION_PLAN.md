# PHASE3_IMPLEMENTATION_PLAN

Stand: 2026-03-07
Status: Phase 3 implementation plan

## 1. Purpose

This document defines the minimal implementation scope for Phase 3: Auditability and Model Control.

The goal is to extend the Phase 2 arena baseline with a clearer audit structure and a minimal local model-control layer while preserving the proposal-only runtime boundary and keeping all state outside registry files.

## 2. Scope Boundaries

In scope:
- minimal audit-oriented trace expansion for arena runs
- separate local audit artifacts outside registry files
- minimal local model/profile definitions
- role/profile selection structure without real provider integration
- small CLI and HTTP surface additions needed to inspect profiles and audit records

Out of scope:
- any write path into `cards/`, `index/`, `human/`, or `taxonomies/`
- any auto-apply or automatic promotion
- validated outputs without `proof_ref` and gates
- memory promotion or `M10` workflows
- specialist-role depth from `M08`
- distillation or judge depth from `M09`
- benchmark systems or broad model-routing infrastructure
- UI work

## 3. Minimal Repo Mapping

Phase 3 extends the current Phase 2 runtime foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`

Minimal new Phase 3 mapping:
- `M13`: local model/profile definitions in `tools/model-control-lib.js`
- `M15`: minimal runtime coordination updates in `tools/arena-lib.js`, `tools/arena.js`, and `tools/arena-server.js`
- `M16`: clearer trace and separate audit artifact output in `tools/arena-lib.js`

## 4. Minimal Build Strategy

To stay inside Phase 3, build only:

1. a reusable local model-control library in `tools/model-control-lib.js`
2. a small extension of arena packets and persisted audit artifacts
3. minimal CLI support to inspect profiles and audit records
4. minimal HTTP support to inspect profiles and audit records
5. a dedicated Phase 3 verification script
6. this plan and a Phase 3 surface description document

Default local runtime storage should remain outside the registry:
- run packets: `runtime/arena-runs/`
- audit records: `runtime/audit-records/`

## 5. Planned Behavior

### Audit / Trace Basis

Each run should more clearly expose:
- run metadata
- decision boundary
- proposal-only status
- registry context source
- evidence placeholder state
- phase timestamps and summary markers

A separate audit record should be persisted for each run outside the registry.

### Minimal Model Control

A run may select a small local profile.
The profile should provide:
- profile name and description
- role bindings for shared evidence, scout, and observer
- local budget and cost posture metadata
- selection strategy metadata

This remains structural only.
No real provider calls or external integrations are required.

## 6. Files to Create or Update

Create:
- `PHASE3_IMPLEMENTATION_PLAN.md`
- `PHASE3_AUDIT_MODEL_CONTROL_SURFACE.md`
- `tools/model-control-lib.js`
- `tools/verify-phase3-audit-control.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`

## 7. Verification Goals

Phase 3 is locally satisfied if:
- proposal-only remains intact
- audit records and runtime traces are persisted outside registry files
- model-control remains small, local, and structural
- no Phase 4 functions are introduced
- CLI and HTTP surfaces expose the minimal audit/model-control additions
- registry files remain unchanged before and after verification
