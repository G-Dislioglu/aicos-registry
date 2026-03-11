# MEC_PHASE4F_IMPLEMENTATION_PLAN

Stand: 2026-03-11
Status: Phase 4F implementation plan

## 1. Purpose

This document defines the minimal implementation scope for the next Phase 4 block: Review Gate Signal Surface.

The goal is to extend the canonical `mec_review_workspace` with one additive, read-first signal surface that normalizes the already-visible Phase 4E digest into compact review / gate readability signals for Desk, CLI, and HTTP without creating a recommendation layer, new outcome, or queue semantics.

## 2. Scope Boundaries

In scope:
- one additive canonical `review_gate_signal_surface` per workspace item, derived only from already-visible workspace signals
- normalization of consolidated digest readability into compact gate signals
- compact gate fields for coverage, stability, contradiction pressure, unresolved watchpoints, review readiness, and gate flags
- minimal CLI and Operator additions to expose the same canonical Phase 4F surface
- one dedicated Phase 4F verifier and compact acceptance document

Out of scope:
- any new review outcome
- any recommendation, ranking, scoring, or next-step engine
- any reopen, rereview, rerank, or queue logic
- any new write path
- any registry mutation or export / canon promotion
- any second truth beside `mec_review_workspace` plus separate raw artifacts
- any broad UI redesign or workflow platform

## 3. Locked Slice

This slice is locked to normalized review gate readability over already-visible challenge digest signals.

This means:
- Phase 4E remains the consolidated digest layer
- Phase 4F only translates that digest into compact gate signals
- no new artifact store, no gate write, and no queue automation may be introduced
- gate signals must remain descriptive rather than imperative

## 4. Minimal Repo Mapping

Phase 4F extends the current MEC review workspace foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`
- current MEC Phase 4E verifier and operator smoke verifier

Minimal new Phase 4F mapping:
- `MEC-04`: consolidated challenge readability becomes normalized review gate readability while remaining additive and non-recommendatory
- `M15`: runtime coordination still exposes one canonical workspace surface over runtime artifacts only
- `M16`: audit-friendly signal normalization over visible gate conditions without creating a second truth or implicit decision engine

## 5. Planned Behavior

### Additive canonical gate signal surface

Each workspace item may expose additive `review_gate_signal_surface` derived only from already-visible signals such as:
- `challenge_dossier_review_digest`
- `challenge_dossier_context`
- `challenge_dossier_delta_context`
- `contradiction_context`
- `decision_packet_context`
- `challenge_context`
- `refutation_context`

### Minimum gate fields

The gate surface must stay compact and readable. It should at least expose:
- `coverage_signal`
- `stability_signal`
- `contradiction_pressure_signal`
- `unresolved_watchpoint_signal`
- `review_readiness_summary`
- `review_readiness_bucket`
- `gate_flags`

### Boundaries

It must not expose:
- recommended action
- recommended outcome
- queue placement or assignment semantics
- reopen / rerank / rereview automation
- any hidden scoring machine disguised as gate readability

## 6. Files to Create or Update

Create:
- `MEC_PHASE4F_IMPLEMENTATION_PLAN.md`
- `MEC_PHASE4F_REVIEW_GATE_SIGNAL_SURFACE_ACCEPTANCE.md`
- `tools/verify-mec-phase4f-review-gate-signal-surface.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`

## 7. Verification Goals

Phase 4F is locally satisfied if:
- canonical workspace items expose additive `review_gate_signal_surface`
- a primary candidate exposes readable normalized coverage / stability / contradiction / watchpoint / readiness signals
- a counterexample contribution preserves readable gate signals without losing primary-candidate linkage
- CLI workspace output exposes compact gate readability
- HTTP workspace detail exposes the same canonical Phase 4F surface
- existing Phase 4E surfaces do not regress
- no recommendation, ranking, queue, or write-path drift is introduced
