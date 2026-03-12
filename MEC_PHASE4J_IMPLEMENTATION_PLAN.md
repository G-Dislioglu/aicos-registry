# MEC_PHASE4J_IMPLEMENTATION_PLAN

Stand: 2026-03-12
Status: Phase 4J implementation plan

## 1. Purpose

This document defines the minimal implementation scope for the next additive MEC review workspace block: Review Action Obligation Surface.

The goal is to extend the canonical `mec_review_workspace` with one additive, read-only obligation layer that makes the current manual review proof burden, evidence expectations, blocking gaps, reviewer attention points, contradiction watchpoints, and defer reasons visible after 4I without introducing recommendation, automation, or any new write semantics.

## 2. Scope Boundaries

In scope:
- one additive canonical `review_action_obligation_surface` per workspace item, derived only from already-visible workspace signals
- compact `manual_action_obligations`
- compact `required_evidence_by_action`
- compact `blocking_gaps_by_action`
- compact `reviewer_attention_points`
- compact `contradiction_watchpoints`
- compact `action_risk_notes`
- compact `action_readiness_summary`
- compact `defer_reasons`
- minimal CLI and Operator additions to expose the same canonical Phase 4J surface
- one dedicated Phase 4J verifier and compact acceptance document

Out of scope:
- any recommendation, ranking, or automated action selection
- any new review outcome or review status
- any reopen, requeue, rerank, or workflow queue semantics
- any write automation or new write path
- any registry mutation or export / canon promotion
- any second truth beside `mec_review_workspace` plus separate raw artifacts
- any broad UI redesign or workflow platform

## 3. Locked Slice

This slice is locked to reviewer-readable obligation condensation over already-visible 4I manual posture and upstream gate signals.

This means:
- Phase 4I remains the compact manual action posture layer
- Phase 4J only reads that posture plus already-visible canonical workspace signals
- 4J may describe what proof burden, evidence expectation, blocker, defer reason, or reviewer attention remains attached to each visible manual action
- 4J must stay descriptive rather than imperative
- no hidden routing, queueing, recommendation, or automation semantics may be introduced

## 4. Minimal Repo Mapping

Phase 4J extends the current MEC review workspace foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`
- current MEC Phase 4I and 4H verifiers

Minimal new Phase 4J mapping:
- `MEC-04`: manual review burden becomes visible without changing write authority
- `M15`: runtime coordination still exposes one canonical workspace surface over runtime artifacts only
- `M16`: reviewer-facing obligation readability over visible gate and posture conditions without creating a second truth or implicit action engine

## 5. Planned Behavior

### Additive canonical obligation surface

Each workspace item may expose additive `review_action_obligation_surface` derived only from already-visible signals such as:
- `control_readiness`
- `evidence_context`
- `challenge_context`
- `refutation_context`
- `challenge_dossier_review_digest`
- `review_gate_signal_surface`
- `review_gate_threshold_trace`
- `review_gate_decision_packet`
- `review_action_posture_surface`
- `review_trace_context`

### Minimum fields

The obligation surface must stay compact and readable. It should at least expose:
- `manual_action_obligations`
- `required_evidence_by_action`
- `blocking_gaps_by_action`
- `reviewer_attention_points`
- `contradiction_watchpoints`
- `action_risk_notes`
- `action_readiness_summary`
- `defer_reasons`

### Boundaries

It must not expose:
- recommended action
- recommended outcome
- automatic action selection
- queue placement or assignment semantics
- reopen / rerank / requeue automation
- any hidden scoring machine disguised as obligation readability

## 6. Files to Create or Update

Create:
- `MEC_PHASE4J_IMPLEMENTATION_PLAN.md`
- `MEC_PHASE4J_REVIEW_ACTION_OBLIGATION_SURFACE_ACCEPTANCE.md`
- `tools/verify-mec-phase4j-review-action-obligation-surface.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`

## 7. Verification Goals

Phase 4J is locally satisfied if:
- canonical workspace items expose additive `review_action_obligation_surface`
- a primary candidate exposes readable action obligations, required evidence, blocking gaps, attention points, contradiction watchpoints, risk notes, readiness summary, and defer reasons
- a counterexample contribution preserves readable obligation context without losing linked primary-candidate context
- CLI workspace output exposes compact obligation readability
- HTTP workspace detail exposes the same canonical Phase 4J surface
- existing Phase 4I and Phase 4H surfaces do not regress
- no recommendation, queue, ranking, reopen, or write-path drift is introduced
