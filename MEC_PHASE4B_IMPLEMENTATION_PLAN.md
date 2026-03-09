# MEC_PHASE4B_IMPLEMENTATION_PLAN

Stand: 2026-03-09
Status: Phase 4B implementation plan

## 1. Purpose

This document defines the minimal implementation scope for MEC Phase 4B: Challenge Evidence & Counterexample Review Context.

The goal is to extend the canonical `mec_review_workspace` so already-created proposal-only `counterexample_candidate` artifacts become compactly readable inside the review desk as visible refutation context, without introducing a new write path, a new counterexample creation variant, a recommendation layer, or a second truth.

## 2. Scope Boundaries

In scope:
- one additive canonical read-model surface for refutation and counterexample review context
- compact relation readability between a `counterexample_candidate` and its refuted primary candidate
- compact readability for visible challenge basis already carried by proposal-only counterexample artifacts
- compact readability for how visible review state and refutation posture currently relate
- minimal CLI / HTTP / Operator additions only where required to expose the same canonical Phase 4B surface
- one dedicated Phase 4B verifier and compact acceptance document

Out of scope:
- any new review outcome
- any recommendation, ranking, scoring, or priority engine
- any new challenge write path
- any new counterexample creation variant
- any automatic re-review, reopen, reject, or follow-up behavior
- any queue, assignment, batch orchestration, or governance platform logic
- any registry mutation or export / canon promotion
- any candidate-wide refutation sweep as the main function
- any second derived truth beside the canonical workspace plus separate raw artifacts
- any Phase-3 cosmetic-only extension that does not add real refutation readability

## 3. Locked Slice

Phase 4B is locked to read-first, context-first counterexample reintegration.

This means:
- Phase 4A remains the only manual challenge create path
- Phase 4B must only read already existing proposal-only counterexample relations
- the canonical workspace may derive compact refutation readability from existing runtime and review signals
- no new create, reopen, reject, or queue behavior may be introduced

## 4. Minimal Repo Mapping

Phase 4B extends the current MEC review workspace foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `web/mec-operator.html`
- current MEC review workspace and operator verifiers

Minimal new Phase 4B mapping:
- `MEC-04`: challenge evidence and counterexample carry-through remain compact, readable, and non-score-led
- `M15`: runtime coordination continues to expose one canonical workspace surface over existing runtime artifacts only
- `M16`: audit-friendly carry-through of visible challenge basis into a canonical refutation read without creating a second truth

## 5. Planned Behavior

### Additive canonical refutation context

Each workspace item may expose additive `refutation_context` derived only from already visible signals such as:
- `refutes_candidate_id`
- already stored proposal-only `counterexample_candidate` artifacts
- carried `challenge_basis` and `challenge_origin` metadata already stored on counterexample artifacts
- current visible review state of the refuted primary candidate
- current visible reviewability or terminal posture of the involved runtime artifacts
- existing visible counterexample posture already derivable from the canonical workspace

`refutation_context` must remain compact, readable, and inspectable.
It must not become a hidden scoring machine, decision substitute, or workflow trigger.

### Counterexample review readability boundary

Phase 4B may expose:
- readable relation summaries
- compact basis summaries
- compact signal and open-gap lists
- compact posture summaries for refuted candidate and visible sibling counterexamples

It must not expose:
- any numeric refutation score as the main decision object
- any candidate ranking over the wider workspace
- any recommendation or priority behavior
- any hidden reopen or reject suggestion

### Read-first desk reintegration

The desk must be able to show, for an already-created proposal-only counterexample:
- what is being refuted
- which visible challenge basis currently supports the read
- how the refuted primary candidate currently stands in the visible review workspace
- which visible signals still constrain or qualify the refutation read

The desk may also show, for a refuted primary candidate:
- which visible counterexamples currently refute it
- how many are already present
- the compact visible posture of those counterexamples

This remains read-first and context-first only.
No new write path is allowed.

## 6. Files to Create or Update

Create:
- `MEC_PHASE4B_IMPLEMENTATION_PLAN.md`
- `MEC_PHASE4B_CHALLENGE_EVIDENCE_COUNTEREXAMPLE_REVIEW_CONTEXT_ACCEPTANCE.md`
- `tools/verify-mec-phase4b-challenge-evidence-counterexample-review-context.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`

## 7. Verification Goals

Phase 4B is locally satisfied if:
- canonical workspace items expose additive `refutation_context`
- a proposal-only `counterexample_candidate` becomes canonically readable as a refutation object inside the workspace
- a refuted primary candidate exposes additive readable counterexample posture beyond Phase 4A's create-only surface
- visible challenge basis remains compact and inspectable
- the operator exposes the same canonical Phase 4B surface without introducing a new write path
- existing Phase 3D through Phase 4A surfaces do not regress
- registry files remain unchanged before and after verification
- no new review outcomes, ranking logic, sweep behavior, or write-path drift are introduced
