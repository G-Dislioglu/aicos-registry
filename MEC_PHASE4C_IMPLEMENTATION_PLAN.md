# MEC_PHASE4C_IMPLEMENTATION_PLAN

Stand: 2026-03-09
Status: Phase 4C implementation plan

## 1. Purpose

This document defines the minimal implementation scope for the next larger Phase 4 block: Primary-Candidate Challenge Dossier & Counterexample Coverage.

The goal is to extend the canonical `mec_review_workspace` so a visibly selected primary candidate can expose a compact read-first, context-first challenge dossier over already existing proposal-only `counterexample_candidate` relations, without introducing a new write path, recommendation behavior, sweep logic, or a second truth.

## 2. Scope Boundaries

In scope:
- one additive canonical dossier-style context for primary-candidate challenge posture over already visible counterexample relations
- compact coverage readability over multiple already existing proposal-only counterexample links to one primary candidate
- compact line-level readability over repeated, distinct, or still-qualified challenge bases when that can be derived from visible existing signals only
- compact contribution readability for each `counterexample_candidate` into the primary candidate's visible challenge dossier
- minimal CLI / HTTP / Operator additions only where required to expose the same canonical Phase 4C surface
- one dedicated Phase 4C verifier and compact acceptance document

Out of scope:
- any new review outcome
- any recommendation, ranking, scoring, or priority engine
- any new challenge write path
- any new counterexample creation variant
- any automatic re-review, reopen, reject, or follow-up behavior
- any queue, assignment, batch orchestration, or governance platform logic
- any registry mutation or export / canon promotion
- any cross-candidate sweep as the main function
- any global refutation collection surface over the full candidate space as the main function
- any second derived truth beside the canonical workspace plus separate raw artifacts
- any cosmetic-only extension that does not add real primary-candidate dossier readability

## 3. Locked Slice

This slice is locked to primary-candidate-centered challenge dossier readability.

This means:
- Phase 4A remains the only manual challenge create path
- Phase 4B remains the base counterexample/refutation reintegration layer
- this block only reads already existing proposal-only counterexample relations and their visible carried basis
- the new value must stay centered on one visible primary candidate and the already visible counterexample relations attached to it
- no global challenge queue, ranking, sweep, or recommendation surface may be introduced

## 4. Minimal Repo Mapping

Phase 4C extends the current MEC review workspace foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `web/mec-operator.html`
- current MEC Phase 4A / 4B verifiers and operator smoke verifier

Minimal new Phase 4C mapping:
- `MEC-04`: challenge carry-through becomes dossier-readable at the primary-candidate level while remaining compact and non-score-led
- `M15`: runtime coordination continues to expose one canonical workspace surface over existing runtime artifacts only
- `M16`: audit-friendly carry-through of visible counterexample basis into one canonical dossier read without creating a second truth

## 5. Planned Behavior

### Additive canonical challenge dossier context

Each workspace item may expose additive `challenge_dossier_context` derived only from already visible signals such as:
- visible proposal-only `counterexample_candidate` artifacts
- existing `challenge_basis` and `challenge_origin` carried by those counterexamples
- existing `challenge_context` and `refutation_context`
- current visible review posture of the primary candidate and visible counterexamples
- unresolved references or missing visible signals that still qualify the visible challenge read

`challenge_dossier_context` must remain compact, readable, and inspectable.
It must not become a hidden scoring machine, queue seed, decision substitute, or workflow trigger.

### Primary-candidate dossier boundary

For a refuted primary candidate, the dossier may expose:
- how many visible counterexample relations currently exist
- how many visible challenge lines appear distinct or repeated, insofar as that is derivable from visible carried basis only
- which visible challenge bases appear to reinforce each other
- which visible challenge lines remain open or qualified
- a compact challenge posture bucket and summary

It must not expose:
- a numeric coverage score as the main object
- a recommendation or priority outcome
- a candidate ranking over the wider workspace
- a queue position or sweep-oriented global collection

### Counterexample contribution boundary

For a `counterexample_candidate`, the dossier may expose:
- which primary candidate it contributes to
- whether its visible carried basis appears to reinforce an existing line, add a distinct line, or remain still-qualified
- which visible challenge line label or signature it currently belongs to

It must not expose:
- any implied reject, reopen, or recommended next step
- any numeric line strength or importance score

## 6. Files to Create or Update

Create:
- `MEC_PHASE4C_IMPLEMENTATION_PLAN.md`
- `MEC_PHASE4C_PRIMARY_CANDIDATE_CHALLENGE_DOSSIER_COUNTEREXAMPLE_COVERAGE_ACCEPTANCE.md`
- `tools/verify-mec-phase4c-primary-candidate-challenge-dossier-counterexample-coverage.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`
- `tools/verify-mec-phase4b-challenge-evidence-counterexample-review-context.js`

## 7. Verification Goals

Phase 4C is locally satisfied if:
- canonical workspace items expose additive `challenge_dossier_context`
- a refuted primary candidate exposes a compact challenge dossier over already visible counterexample relations
- a `counterexample_candidate` exposes its additive contribution to that dossier
- dossier buckets and line readability stay compact, inspectable, and non-score-led
- the operator and CLI expose the same canonical Phase 4C surface without introducing a new write path
- existing Phase 4A and Phase 4B surfaces do not regress
- registry files remain unchanged before and after verification
- no recommendation, ranking, sweep, queue, or write-path drift is introduced
