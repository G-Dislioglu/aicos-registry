# PHASE4F_IMPLEMENTATION_PLAN

Stand: 2026-03-08
Status: Phase 4F implementation plan

## 1. Purpose

This document defines the minimal implementation scope for Phase 4F: Export Gate Decision Model.

Phase 4F adds a small, explicit runtime-only export-gate decision layer on top of the existing Phase 4D export-readiness model and the Phase 4E export-review record layer. The goal is to make a candidate's current runtime gate state readable without introducing any real export, canon write, promotion, or registry mutation.

## 2. Scope Boundaries

In scope:
- a runtime-only export-gate decision helper
- explicit derived gate statuses
- explicit gate reasons and gate blockers
- minimal candidate read-model extension exposing gate decision state
- small CLI and HTTP read-surface improvements only where they directly expose gate state
- dedicated verification and compact documentation

Out of scope:
- registry mutation
- canon write
- real export pipeline
- promotion logic
- institutional memory writes
- judge or specialist expansion
- provider integration
- broad arena refactor
- MEC expansion in this block
- large new taxonomies

## 3. Reference Language

M01-M17 remains the reference language.

Phase 4F extends the current runtime governance line by making the runtime gate state explicit after:
- proposal-only candidate creation
- runtime review consolidation
- export-readiness preparation
- export-review records

## 4. Minimal Repo Mapping

Phase 4F mainly reinforces:
- `M10`: runtime candidate assessment layering
- `M15`: read-surface clarity for governance state
- `M16`: runtime boundary discipline before any future export pilot exists

## 5. Planned Runtime Behavior

### Gate-decision vocabulary

Phase 4F derives:
- `export_blocked`
- `export_needs_human_decision`
- `export_gate_passed_runtime`

### Gate input signals

Gate decision is derived only from existing runtime-only signals, including:
- `export_readiness_status`
- `export_review_summary`
- `has_boundary`
- `has_review_record`
- `review_integrity`
- `review_coverage`
- `export_blockers`

### Gate semantics

- `export_blocked` means current runtime conditions still block a gate pass
- `export_needs_human_decision` means the candidate is runtime-ready enough that a human-facing gate decision is still pending or incomplete
- `export_gate_passed_runtime` means current runtime signals and formal runtime export-review state both support a gate pass

This still does not mean:
- exported
- promoted
- registry written
- canonized

## 6. Files to Create or Update

Create:
- `PHASE4F_IMPLEMENTATION_PLAN.md`
- `PHASE4F_EXPORT_GATE_DECISION_MODEL.md`
- `tools/memory-export-gate-lib.js`
- `tools/verify-phase4f-export-gate-decision-model.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`

## 7. Verification Goals

Phase 4F is locally satisfied if:
- Phase 4A remains green
- Phase 4B remains green
- Phase 4C remains green
- Phase 4D remains green
- Phase 4E remains green
- registry files remain unchanged
- gate decision remains runtime-only
- candidate files remain proposal-only artifacts
- export_gate_passed_runtime does not execute export, promotion, or registry mutation
