# MEC_PHASE4D_IMPLEMENTATION_PLAN

Stand: 2026-03-11
Status: Phase 4D implementation plan

## 1. Purpose

This document defines the minimal implementation scope for the next Phase 4 block: Challenge Dossier Delta / Evolution Context.

The goal is to extend the canonical `mec_review_workspace` with an additive, read-first, context-first view of how the visible challenge situation of a single primary candidate has changed relative to the last visible review anchor, derived exclusively from already-visible counterexample, review, and dossier signals.

## 2. Scope Boundaries

In scope:
- one additive canonical `challenge_dossier_delta_context` per workspace item, derived from already-visible Phase 4C challenge dossier signals and review record timestamps
- per-line classification as new, stable, updated, or qualified-open relative to the last review anchor timestamp
- a compact movement bucket summarising dossier evolution: expanding, stabilizing, updated, posture_shifted, pressure_without_coverage, unchanged, or not_derivable
- a pre-anchor posture bucket simulation for comparison with the current posture bucket
- compact evolution signals array for human-readable change description
- minimal CLI and Operator additions to expose the same canonical Phase 4D surface
- one dedicated Phase 4D verifier and compact acceptance document

Out of scope:
- any new review outcome
- any recommendation, ranking, scoring, or priority engine
- any new challenge write path
- any new counterexample creation variant
- any automatic re-review, reopen, reject, or follow-up behavior
- any queue, assignment, batch orchestration, or governance platform logic
- any registry mutation or export / canon promotion
- any cross-candidate sweep as the main function
- any global challenge delta collection over the full candidate space
- any second derived truth beside the canonical workspace plus separate raw artifacts
- any cosmetic-only extension that does not add real primary-candidate evolution readability

## 3. Locked Slice

This slice is locked to primary-candidate-centered challenge dossier evolution readability.

This means:
- Phase 4A remains the only manual challenge create path
- Phase 4B remains the base counterexample/refutation reintegration layer
- Phase 4C remains the static dossier snapshot layer
- Phase 4D only reads timestamps of already existing counterexamples and review records
- the new value must remain centered on one visible primary candidate and the review anchor already stored in that candidate's workspace
- no global challenge delta queue, ranking, sweep, or recommendation surface may be introduced

## 4. Minimal Repo Mapping

Phase 4D extends the current MEC review workspace foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `web/mec-operator.html`
- current MEC Phase 4A / 4B / 4C verifiers and operator smoke verifier

Minimal new Phase 4D mapping:
- `MEC-04`: challenge carry-through becomes time-aware and evolution-readable at the primary-candidate level while remaining compact and non-score-led
- `M15`: runtime coordination continues to expose one canonical workspace surface over existing runtime artifacts only
- `M16`: audit-friendly carry-through of visible challenge evolution without creating a second truth or implicit recommendation path

## 5. Planned Behavior

### Additive canonical challenge dossier delta context

Each workspace item may expose additive `challenge_dossier_delta_context` derived only from already-visible signals such as:
- the already-computed `challenge_dossier_context` from Phase 4C (challenge_lines, challenge_posture_bucket)
- the `created_at` and `updated_at` timestamps of visible counterexample candidates
- the `reviewed_at` timestamp of the latest review record (anchor timestamp)
- the candidate `created_at` as a fallback anchor when no review exists

`challenge_dossier_delta_context` must remain compact, readable, and inspectable.
It must not become a hidden scoring machine, queue seed, decision substitute, or workflow trigger.

### Per-line evolution classification

For each challenge line in the current dossier, 4D classifies it by timing relative to the anchor:
- `new_lines`: all counterexamples in the line were created after the anchor
- `stable_lines`: all counterexamples in the line were created at or before the anchor
- `updated_lines`: the line has counterexamples from both before and after the anchor
- `qualified_open_lines`: lines with open_qualifier_count > 0, regardless of timing

### Movement bucket

The top-level `movement_bucket` summarises dossier evolution:
- `expanding`: new challenge lines appeared since anchor
- `stabilizing`: all visible lines pre-date the anchor, no new pressure
- `updated`: no entirely new lines, but lines carry counterexamples from both sides of anchor
- `posture_shifted`: no new lines but the simulated pre-anchor posture bucket differs from current
- `pressure_without_coverage`: challenge pressure visible but no counterexample lines present
- `unchanged`: no meaningful change detectable
- `not_derivable`: no anchor available

### Posture change simulation

4D simulates the pre-anchor posture bucket by running `deriveMecChallengeDossierBucket` only on counterexamples that existed before the anchor. Comparing the simulated bucket to the current bucket yields `posture_changed` and `previous_posture_bucket`.

### Boundaries

It must not expose:
- a numeric score as the main object
- a recommendation or priority outcome
- a candidate ranking over the wider workspace
- any implied reject, reopen, or next-step guidance

## 6. Files to Create or Update

Create:
- `MEC_PHASE4D_IMPLEMENTATION_PLAN.md`
- `MEC_PHASE4D_CHALLENGE_DOSSIER_DELTA_ACCEPTANCE.md`
- `tools/verify-mec-phase4d-challenge-dossier-delta-evolution-context.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`

## 7. Verification Goals

Phase 4D is locally satisfied if:
- canonical workspace items expose additive `challenge_dossier_delta_context`
- a primary candidate with post-anchor counterexamples shows movement_bucket `expanding`
- a primary candidate with only pre-anchor counterexamples shows movement_bucket `stabilizing`
- a primary candidate without a review anchor shows `anchor_kind: candidate_created`
- the operator and CLI expose the same canonical Phase 4D surface
- existing Phase 4A, 4B, and 4C surfaces do not regress
- registry files remain unchanged before and after verification
- no recommendation, ranking, sweep, queue, or write-path drift is introduced
