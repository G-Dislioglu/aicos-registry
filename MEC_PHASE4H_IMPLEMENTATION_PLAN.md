# MEC_PHASE4H_IMPLEMENTATION_PLAN

Stand: 2026-03-11
Status: Phase 4H implementation plan

## 1. Purpose

This document defines the minimal implementation scope for the next Phase 4 block: Review Gate Decision Packet Surface.

The goal is to extend the canonical `mec_review_workspace` with one additive, read-first decision packet layer that gives the reviewer a compact, evidence-near, decision-taugliche packet over the already-visible 4E digest, 4F gate signals, and 4G threshold trace.

## 2. Scope Boundaries

In scope:
- one additive canonical `review_gate_decision_packet` per workspace item, derived only from already-visible workspace signals
- compact `decision_snapshot`
- compact `decision_basis`
- compact `evidence_anchor_read`
- compact `decision_risk_read`
- compact `unresolved_decision_points`
- compact `packet_flags`
- compact `decision_packet_summary`
- minimal CLI and Operator additions to expose the same canonical Phase 4H surface
- one dedicated Phase 4H verifier and compact acceptance document

Out of scope:
- any new review outcome
- any recommendation, ranking, scoring, or automated decision engine
- any reopen, requeue, rerank, or write automation
- any new write path
- any registry mutation or export / canon promotion
- any second truth beside `mec_review_workspace` plus separate raw artifacts
- any broad UI redesign or workflow platform

## 3. Locked Slice

This slice is locked to reviewer-readable decision packet condensation over already-visible gate signals and explanations.

This means:
- Phase 4E remains the consolidated digest layer
- Phase 4F remains the normalized gate signal layer
- Phase 4G remains the threshold / reason-code explanation layer
- Phase 4H only bundles that into one reviewer-taugliche decision packet
- no new artifact store, no decision write, and no queue semantics may be introduced
- the packet must remain descriptive rather than imperative

## 4. Minimal Repo Mapping

Phase 4H extends the current MEC review workspace foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`
- current MEC Phase 4G verifier and operator smoke verifier

Minimal new Phase 4H mapping:
- `MEC-04`: gate readability becomes a compact decision packet without changing truth ownership or outcomes
- `M15`: runtime coordination still exposes one canonical workspace surface over runtime artifacts only
- `M16`: reviewer-facing packet readability over visible gate conditions without creating a second truth or implicit decision engine

## 5. Planned Behavior

### Additive canonical decision packet surface

Each workspace item may expose additive `review_gate_decision_packet` derived only from already-visible signals such as:
- `challenge_dossier_review_digest`
- `review_gate_signal_surface`
- `review_gate_threshold_trace`
- `evidence_context`
- `challenge_context`
- `refutation_context`
- `decision_packet_context`

### Minimum fields

The decision packet must stay compact and readable. It should at least expose:
- `decision_snapshot`
- `decision_basis`
- `evidence_anchor_read`
- `decision_risk_read`
- `unresolved_decision_points`
- `packet_flags`
- `decision_packet_summary`

### Boundaries

It must not expose:
- recommended action
- recommended outcome
- queue placement or assignment semantics
- reopen / rerank / requeue automation
- any hidden scoring machine disguised as packet readability

## 6. Files to Create or Update

Create:
- `MEC_PHASE4H_IMPLEMENTATION_PLAN.md`
- `MEC_PHASE4H_REVIEW_GATE_DECISION_PACKET_ACCEPTANCE.md`
- `tools/verify-mec-phase4h-review-gate-decision-packet-surface.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`

## 7. Verification Goals

Phase 4H is locally satisfied if:
- canonical workspace items expose additive `review_gate_decision_packet`
- a primary candidate exposes readable snapshot, basis, anchors, risk read, open decision points, flags, and packet summary
- a counterexample contribution preserves readable decision packet context
- CLI workspace output exposes compact decision packet readability
- HTTP workspace detail exposes the same canonical Phase 4H surface
- existing Phase 4G surfaces do not regress
- no recommendation, ranking, queue, or write-path drift is introduced
