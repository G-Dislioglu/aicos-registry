# PHASE2_IMPLEMENTATION_PLAN

Stand: 2026-03-07
Status: Phase 2 implementation plan

## 1. Purpose

This document defines the minimal implementation scope for Phase 2: a proposal-only arena foundation.

The goal is to add the smallest structurally correct runtime baseline that can accept run input, build a shared evidence placeholder, produce scout and observer placeholder outputs, and persist trace artifacts outside the registry.

## 2. Scope Boundaries

In scope:
- proposal-only run input handling
- a shared evidence input boundary and placeholder evidence pack
- a minimal scout output structure
- a deterministic observer decision placeholder structure
- trace output persisted outside registry files
- a minimal CLI and HTTP runtime surface using built-in Node modules only

Out of scope:
- any write path into `cards/`, `index/`, `human/`, or `taxonomies/`
- any automatic apply or promotion
- validated outputs without `proof_ref` and gates
- model-control logic from `M13`
- trace/audit depth from full `M16`
- memory promotion from `M10`
- distillation/judge logic from `M09`
- specialist roles from `M08`
- UI work

## 3. Minimal Repo Mapping

Phase 2 builds on the existing Phase 1 basis:
- `tools/registry-readonly-lib.js`
- `tools/registry-readonly.js`
- `tools/registry-readonly-server.js`

Minimal new Phase 2 mapping:
- `M05`: a lightweight arena run packet structure in `tools/arena-lib.js`
- `M06`: deterministic scout placeholder output in `tools/arena-lib.js`
- `M07`: deterministic observer placeholder decision in `tools/arena-lib.js`
- `M12`: shared evidence input placeholder boundary in `tools/arena-lib.js`
- `M15`: minimal CLI/HTTP coordination in `tools/arena.js` and `tools/arena-server.js`

## 4. Minimal Build Strategy

To stay inside Phase 2, build only:

1. a reusable arena runtime library in `tools/arena-lib.js`
2. a minimal CLI surface in `tools/arena.js`
3. a minimal HTTP surface in `tools/arena-server.js`
4. a verification script in `tools/verify-phase2-arena.js`
5. this plan and a Phase 2 surface description document

Default local runtime storage should be:
- `runtime/arena-runs/`

But verification may override the output directory to a temporary path to keep the git scope clean.

## 5. Planned Behavior

### Run Input

Support proposal-only run input with:
- `question`
- optional target IDs
- optional registry filters
- optional shared evidence request fields

### Shared Evidence Pack

Build a placeholder shared evidence pack with:
- requested topic or question focus
- requested sources or hints
- empty evidence items by default
- explicit placeholder status

### Scout Output

Build a deterministic scout placeholder output with:
- candidate card IDs from registry-grounded lookup
- simple hypothesis placeholders
- friction signals
- explicit proposal-only status

### Observer Decision

Build a deterministic observer placeholder decision with:
- proposal-only continue or escalate outcome
- reasons
- risk signals
- explicit `validated: false`
- explicit `apply_allowed: false`

### Trace Output Basis

Persist structured run artifacts outside the registry with:
- packet metadata
- input snapshot
- shared evidence placeholder
- scout output
- observer decision
- trace phase summary

## 6. Files to Create

- `PHASE2_IMPLEMENTATION_PLAN.md`
- `PHASE2_MINIMAL_ARENA_SURFACE.md`
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `tools/verify-phase2-arena.js`

## 7. Verification Goals

Phase 2 is locally satisfied if:
- arena runs remain proposal-only
- trace artifacts are written only outside registry files
- registry files remain unchanged before and after test runs
- CLI and HTTP surfaces both work for the minimal runtime contract
- the implementation does not drift into Phase 3 or Phase 4 behavior
