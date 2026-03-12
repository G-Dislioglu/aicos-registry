# MEC_PHASE4I_IMPLEMENTATION_PLAN

Stand: 2026-03-12
Status: Phase 4I implementation plan

## 1. Purpose

This document defines the minimal implementation scope for the next additive MEC review workspace block: Review Action Posture Surface.

The goal is to extend the canonical `mec_review_workspace` with one additive, read-only posture layer that makes the current manual review action posture visible after 4H without introducing recommendation, automation, or any new write semantics.

## 2. Scope Boundaries

In scope:
- one additive canonical `review_action_posture_surface` per workspace item, derived only from already-visible workspace signals
- compact `allowed_manual_actions`
- compact `blocked_manual_actions`
- compact `action_preconditions`
- compact `posture_bucket`
- compact `posture_flags`
- compact `manual_next_step_read`
- compact `hold_reasons`
- compact `escalation_reasons`
- minimal CLI and Operator additions to expose the same canonical Phase 4I surface
- one dedicated Phase 4I verifier and compact acceptance document

Out of scope:
- any recommendation, ranking, or automated action selection
- any new review outcome or review status
- any reopen, requeue, rerank, or workflow queue semantics
- any write automation or new write path
- any registry mutation or export / canon promotion
- any second truth beside `mec_review_workspace` plus separate raw artifacts
- any broad UI redesign or workflow platform

## 3. Locked Slice

This slice is locked to reviewer-readable manual posture condensation over already-visible gate conditions.

This means:
- Phase 4H remains the compact decision packet layer
- Phase 4I only reads that packet plus already-visible canonical workspace signals
- 4I may describe which manual review actions are currently visible, qualified, blocked, or preconditioned
- 4I must stay descriptive rather than imperative
- no hidden routing, queueing, recommendation, or automation semantics may be introduced

## 4. Minimal Repo Mapping

Phase 4I extends the current MEC review workspace foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`
- current MEC Phase 4H verifier and operator smoke verifier

Minimal new Phase 4I mapping:
- `MEC-04`: the manual review posture becomes visible without changing write authority
- `M15`: runtime coordination still exposes one canonical workspace surface over runtime artifacts only
- `M16`: reviewer-facing posture readability over visible gate conditions without creating a second truth or implicit action engine

## 5. Planned Behavior

### Additive canonical posture surface

Each workspace item may expose additive `review_action_posture_surface` derived only from already-visible signals such as:
- `control_readiness`
- `evidence_context`
- `challenge_context`
- `refutation_context`
- `challenge_dossier_review_digest`
- `review_gate_signal_surface`
- `review_gate_threshold_trace`
- `review_gate_decision_packet`
- `review_trace_context`

### Minimum fields

The posture surface must stay compact and readable. It should at least expose:
- `allowed_manual_actions`
- `blocked_manual_actions`
- `action_preconditions`
- `posture_bucket`
- `posture_flags`
- `manual_next_step_read`
- `hold_reasons`
- `escalation_reasons`

### Boundaries

It must not expose:
- recommended action
- recommended outcome
- automatic action selection
- queue placement or assignment semantics
- reopen / rerank / requeue automation
- any hidden scoring machine disguised as manual posture readability

## 6. Files to Create or Update

Create:
- `MEC_PHASE4I_IMPLEMENTATION_PLAN.md`
- `MEC_PHASE4I_REVIEW_ACTION_POSTURE_SURFACE_ACCEPTANCE.md`
- `tools/verify-mec-phase4i-review-action-posture-surface.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`

## 7. Verification Goals

Phase 4I is locally satisfied if:
- canonical workspace items expose additive `review_action_posture_surface`
- a primary candidate exposes readable allowed actions, blocked actions, preconditions, posture bucket, flags, hold reasons, escalation reasons, and next-step read
- a counterexample contribution preserves readable posture context without losing linked primary-candidate context
- CLI workspace output exposes compact posture readability
- HTTP workspace detail exposes the same canonical Phase 4I surface
- existing Phase 4H surfaces do not regress
- no recommendation, queue, ranking, reopen, or write-path drift is introduced
