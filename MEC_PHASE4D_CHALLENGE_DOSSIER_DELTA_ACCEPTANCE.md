# MEC Phase 4D Challenge Dossier Delta / Evolution Context Acceptance

## Accepted user-visible value

This block extends the existing Phase 4C challenge dossier layer by making the visible challenge situation of one primary candidate temporally readable: how has the challenge dossier changed since the last visible review anchor?

Accepted value:
- the desk remains anchored on the canonical `mec_review_workspace`
- a workspace item may now expose additive `challenge_dossier_delta_context`
- a primary candidate can show which challenge lines are new since the last review anchor
- a primary candidate can show which challenge lines were already stable before the last review anchor
- a primary candidate can show which challenge lines carry partial updates (counterexamples from both sides of the anchor)
- a primary candidate can show whether the dossier posture has shifted since the anchor
- the movement_bucket gives a compact single-word read of dossier evolution: expanding, stabilizing, updated, posture_shifted, pressure_without_coverage, unchanged, or not_derivable
- when no review anchor exists, candidate creation time serves as the fallback anchor
- raw candidate artifacts remain raw runtime artifacts
- raw review records remain separate runtime review artifacts
- no recommendation engine, queue engine, governance platform, ranking system, or second truth is introduced
- no new write path is introduced

## Accepted visible surfaces

The review desk must now show, in addition to Phase 4C:
- a visible **Challenge dossier delta / evolution** section
- readable movement bucket for the current dossier evolution state
- readable new / stable / updated / qualified-open line classification relative to the anchor
- readable anchor kind (last review vs. candidate creation)
- readable evolution signals array summarising what changed
- readable posture change flag when the simulated pre-anchor bucket differs from current

These surfaces remain additive and do not replace evidence, history, focus, compare, delta, decision, contradiction, challenge, refutation, challenge dossier, review trace, raw review, or raw candidate surfaces.

## Accepted architectural rule

Still true:
- `mec_review_workspace` remains the only canonical derived truth
- raw candidate artifacts remain proposal-origin runtime artifacts
- raw review records remain separate runtime artifacts
- proposal-only `counterexample_candidate` artifacts remain proposal-only
- no new review outcomes
- no registry mutation
- no export / canon promotion
- no workflow / governance / assignment platform
- no queue engine or bulk orchestration layer
- no recommendation engine
- no hidden ranking or scoring machine
- no new challenge write path
- no new counterexample creation variant
- no global challenge delta sweep as the main function
- no second truth beside the canonical workspace plus separate raw artifacts

Phase 4D is only accepted when:
- the new value stays primary-candidate-centered
- challenge dossier evolution readability remains read-first and context-first
- movement bucket and line classification stay compact and non-score-led
- no implicit reject, reopen, or priority behavior is introduced
- the operator and CLI render the same canonical Phase 4D delta read-model
- Phase 4A, 4B, and 4C surfaces do not regress

## Executable proof

Run:

```bash
node tools/verify-mec-phase4d-challenge-dossier-delta-evolution-context.js
```

The proof verifies:
- canonical workspace exposes additive `challenge_dossier_delta_context`
- a primary candidate with post-anchor counterexamples shows movement_bucket `expanding`
- a primary candidate with only pre-anchor counterexamples shows movement_bucket `stabilizing`
- a primary candidate without a review anchor shows anchor_kind `candidate_created`
- the review desk renders the visible Phase 4D delta surface
- existing Phase 4A, 4B, and 4C surfaces do not regress
- no outcome, workflow, ranking, sweep, queue, or write-path drift is introduced
