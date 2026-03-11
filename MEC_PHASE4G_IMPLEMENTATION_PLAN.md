# MEC_PHASE4G_IMPLEMENTATION_PLAN

Stand: 2026-03-11
Status: Phase 4G implementation plan

## 1. Purpose

This document defines the minimal implementation scope for the next Phase 4 block: Gate Threshold Trace & Reason-Code Surface.

The goal is to extend the canonical `mec_review_workspace` with one additive, read-first explanation layer that makes the already-visible Phase 4F gate signals transparently readable: which reason codes, thresholds, and carried inputs explain the current review gate bucket?

## 2. Scope Boundaries

In scope:
- one additive canonical `review_gate_threshold_trace` per workspace item, derived only from already-visible workspace signals
- compact normalized `reason_codes`
- compact `threshold_trace` over the current gate bucket
- compact separation of `blocker_reasons`, `concern_reasons`, and `support_reasons`
- compact `signal_provenance_read`
- compact `bucket_explanation_summary`
- minimal CLI and Operator additions to expose the same canonical Phase 4G surface
- one dedicated Phase 4G verifier and compact acceptance document

Out of scope:
- any new review outcome
- any recommendation, ranking, scoring, or decision engine
- any reopen, requeue, rerank, or write automation
- any new write path
- any registry mutation or export / canon promotion
- any second truth beside `mec_review_workspace` plus separate raw artifacts
- any broad UI redesign or workflow platform

## 3. Locked Slice

This slice is locked to explanation of already-visible gate signals.

This means:
- Phase 4E remains the consolidated digest layer
- Phase 4F remains the normalized gate signal layer
- Phase 4G only explains why the current gate bucket and signals read as they do
- no new artifact store, no gate write, and no queue semantics may be introduced
- reason codes must remain compact, reusable, and descriptive rather than imperative

## 4. Minimal Repo Mapping

Phase 4G extends the current MEC review workspace foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`
- current MEC Phase 4F verifier and operator smoke verifier

Minimal new Phase 4G mapping:
- `MEC-04`: normalized gate readability becomes transparent threshold and reason-code readability while remaining additive and non-recommendatory
- `M15`: runtime coordination still exposes one canonical workspace surface over runtime artifacts only
- `M16`: audit-friendly traceability over visible gate conditions without creating a second truth or implicit decision engine

## 5. Planned Behavior

### Additive canonical threshold trace surface

Each workspace item may expose additive `review_gate_threshold_trace` derived only from already-visible signals such as:
- `review_gate_signal_surface`
- `challenge_dossier_review_digest`
- `challenge_dossier_context`
- `challenge_dossier_delta_context`
- `contradiction_context`
- `decision_packet_context`

### Minimum fields

The threshold trace must stay compact and readable. It should at least expose:
- `threshold_trace`
- `reason_codes`
- `blocker_reasons`
- `concern_reasons`
- `support_reasons`
- `signal_provenance_read`
- `bucket_explanation_summary`
- `trace_flags`

### Boundaries

It must not expose:
- recommended action
- recommended outcome
- queue placement or assignment semantics
- reopen / rerank / requeue automation
- any hidden scoring machine disguised as trace readability

## 6. Files to Create or Update

Create:
- `MEC_PHASE4G_IMPLEMENTATION_PLAN.md`
- `MEC_PHASE4G_GATE_THRESHOLD_TRACE_REASON_CODE_ACCEPTANCE.md`
- `tools/verify-mec-phase4g-gate-threshold-trace-reason-code-surface.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`

## 7. Verification Goals

Phase 4G is locally satisfied if:
- canonical workspace items expose additive `review_gate_threshold_trace`
- a primary candidate exposes readable reason codes, threshold trace, provenance, blockers, concerns, supports, and explanation summary
- a counterexample contribution preserves readable threshold trace context
- CLI workspace output exposes compact reason-code readability
- HTTP workspace detail exposes the same canonical Phase 4G surface
- existing Phase 4F surfaces do not regress
- no recommendation, ranking, queue, or write-path drift is introduced
