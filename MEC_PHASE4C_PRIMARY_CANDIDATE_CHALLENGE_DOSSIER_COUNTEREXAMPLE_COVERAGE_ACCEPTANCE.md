# MEC Phase 4C Primary-Candidate Challenge Dossier & Counterexample Coverage Acceptance

## Accepted user-visible value

This block extends the existing Phase 4A and Phase 4B challenge line by making the visible challenge situation of one primary candidate canonically readable as a compact dossier over its already existing proposal-only counterexample relations.

Accepted value:
- the desk remains anchored on the canonical `mec_review_workspace`
- a workspace item may now expose additive `challenge_dossier_context`
- a refuted primary candidate can show a compact visible challenge dossier over multiple already existing counterexample relations
- a `counterexample_candidate` can show its compact contribution to that dossier
- repeated, distinct, or still-qualified visible challenge lines may be read compactly when derivable from existing carried basis only
- visible challenge posture remains compact and inspectable
- raw candidate artifacts remain raw runtime artifacts
- raw review records remain separate runtime review artifacts
- no recommendation engine, queue engine, governance platform, ranking system, or second truth is introduced
- no new write path is introduced

## Accepted visible surfaces

The review desk must now show, in addition to Phase 4B:
- a visible **Challenge dossier context** section
- readable dossier posture for a refuted primary candidate
- readable line-level challenge coverage over already existing visible counterexample relations
- readable carry-through of repeated or distinct visible challenge lines when those can be derived from already visible basis
- readable open challenge gaps that remain despite visible counterexample coverage
- readable counterexample contribution context showing how one proposal-only counterexample contributes to the visible primary-candidate dossier

These surfaces remain additive and do not replace evidence, history, focus, compare, delta, decision, contradiction, challenge, refutation, review trace, raw review, or raw candidate surfaces.

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
- no global challenge sweep as the main function
- no second truth beside the canonical workspace plus separate raw artifacts

Phase 4C is only accepted when:
- the new value stays primary-candidate-centered
- challenge dossier readability remains read-first and context-first
- visible coverage stays compact and non-score-led
- no implicit reject, reopen, or priority behavior is introduced
- the operator and CLI render the same canonical dossier read-model rather than inventing separate truths

## Executable proof

Run:

```bash
node tools/verify-mec-phase4c-primary-candidate-challenge-dossier-counterexample-coverage.js
```

The proof verifies:
- canonical workspace exposes additive `challenge_dossier_context`
- a refuted primary candidate exposes compact dossier readability over multiple visible counterexample relations
- a `counterexample_candidate` exposes compact contribution readability into that dossier
- the review desk renders the visible dossier surface
- existing 4A and 4B surfaces do not regress
- no outcome, workflow, ranking, sweep, queue, or write-path drift is introduced
