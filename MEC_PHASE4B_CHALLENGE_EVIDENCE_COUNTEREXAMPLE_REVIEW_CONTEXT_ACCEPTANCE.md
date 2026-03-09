# MEC Phase 4B Challenge Evidence & Counterexample Review Context Acceptance

## Accepted user-visible value

Phase 4B extends the existing Phase 4A challenge line by making already-created proposal-only counterexamples canonically readable inside the review desk as compact refutation context.

Accepted value:
- the desk remains anchored on the canonical `mec_review_workspace`
- a workspace item may now expose additive `refutation_context`
- a `counterexample_candidate` becomes readable as a visible refutation object, not only as a raw proposal artifact
- a refuted primary candidate can show additive readable refutation posture over already existing counterexample relations
- visible challenge basis remains compact and inspectable
- raw candidate artifacts remain raw runtime artifacts
- raw review records remain separate runtime review artifacts
- no recommendation engine, queue engine, governance platform, ranking system, or second truth is introduced
- no new write path is introduced

## Accepted visible surfaces

The review desk must now show, in addition to Phase 4A:
- a visible **Refutation context** section
- readable relation context showing what refutes what
- readable challenge-basis carry-through over already stored counterexample metadata
- readable current posture of the refuted primary candidate from the canonical workspace
- readable open gaps or qualifying signals that still constrain the refutation read
- readable visible sibling counterexample posture when more than one counterexample refutes the same primary candidate

These surfaces remain additive and do not replace evidence, history, focus, compare, delta, decision, contradiction, challenge, review trace, raw review, or raw candidate surfaces.

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
- no candidate-wide refutation sweep as the main function
- no second truth beside the canonical workspace plus separate raw artifacts

Phase 4B is only accepted when:
- the new value is read-first and context-first
- already-created proposal-only counterexamples become canonically readable without introducing a new write path
- refutation readability stays compact and non-recommendatory
- no implicit reject, reopen, or priority behavior is introduced
- the operator surface renders the same canonical read-model rather than inventing a UI-only truth

## Executable proof

Run:

```bash
node tools/verify-mec-phase4b-challenge-evidence-counterexample-review-context.js
```

The proof verifies:
- canonical workspace exposes additive `refutation_context`
- a `counterexample_candidate` exposes compact refutation/readability over already visible challenge basis and linked primary posture
- a refuted primary candidate exposes readable counterexample posture additively
- the review desk renders the visible refutation surface
- existing 3D through 4A desk and workspace surfaces do not regress
- no outcome, workflow, ranking, sweep, or write-path drift is introduced
