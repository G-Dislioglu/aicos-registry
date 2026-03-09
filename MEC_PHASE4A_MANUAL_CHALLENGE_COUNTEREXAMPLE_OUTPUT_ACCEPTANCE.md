# MEC Phase 4A Manual Challenge Pass & Counterexample Output Acceptance

## Accepted user-visible value

Phase 4A introduces the first real MEC challenge slice after the review-integration line.

Accepted value:
- the desk remains anchored on the canonical `mec_review_workspace`
- each workspace item may now expose additive `challenge_context`
- the desk can show a compact contradiction-pressure read for one selected candidate
- an operator may explicitly create one proposal-only runtime `counterexample_candidate` from that selected primary candidate
- raw candidate artifacts remain raw runtime artifacts
- raw review records remain separate runtime review artifacts
- no recommendation engine, queue engine, governance platform, or second truth is introduced

## Accepted visible surfaces

The review desk must now show, in addition to Phase 3I:
- a visible **Challenge context** section
- readable contradiction-pressure bucket / flag output
- readable challenge signals showing what currently strengthens or weakens a challenge read
- readable existing counterexample posture for the selected candidate
- a visible manual counterexample proposal path tied to the currently selected primary candidate

These surfaces remain additive and do not replace evidence, history, focus, compare, delta, decision, contradiction, review trace, raw review, or raw candidate surfaces.

## Accepted architectural rule

Still true:
- `mec_review_workspace` remains the only canonical derived truth
- raw candidate artifacts remain proposal-origin runtime artifacts
- raw review records remain separate runtime artifacts
- manual challenge output remains a proposal-only runtime `counterexample_candidate`
- no new review outcomes
- no registry mutation
- no export / canon promotion
- no workflow / governance / assignment platform
- no queue engine or bulk orchestration layer
- no recommendation engine
- no hidden ranking or scoring machine
- no second truth beside the canonical workspace plus separate raw artifacts

Phase 4A is only accepted when:
- the counterexample create path is tied to one visibly selected primary candidate
- contradiction pressure remains compact bucket / flag readability, not a score-led decision substitute
- the create path stays explicit and manual
- no automatic review write or reopen behavior is introduced

## Executable proof

Run:

```bash
node tools/verify-mec-phase4a-manual-challenge-counterexample-output.js
```

The proof verifies:
- canonical workspace exposes additive `challenge_context`
- contradiction pressure remains compact and readable
- manual challenge create path produces runtime-only proposal-only `counterexample_candidate` artifacts
- the review desk renders the visible challenge surface
- existing 3D through 3I desk and workspace surfaces do not regress
- no outcome, workflow, queue, or recommendation drift is introduced
