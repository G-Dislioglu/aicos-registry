# MEC Phase 4F Review Gate Signal Surface Acceptance

## Accepted user-visible value

This block extends the existing Phase 4E challenge dossier review digest by making the digest structurally gate-readable: the canonical workspace now exposes normalized review gate signals for coverage, stability, contradiction pressure, unresolved watchpoints, readiness, and gate flags.

Accepted value:
- the desk remains anchored on the canonical `mec_review_workspace`
- a workspace item may now expose additive `review_gate_signal_surface`
- a primary candidate can show one compact normalized gate read over the existing digest
- a counterexample contribution can show the same normalized gate read without losing its primary-candidate-linked digest context
- gate signals remain descriptive and compact
- gate flags remain review context only, not workflow triggers
- raw candidate artifacts remain raw runtime artifacts
- raw review records remain separate runtime review artifacts
- no new outcome, recommendation layer, queue engine, or second truth is introduced
- no new write path is introduced

## Accepted visible surfaces

The review desk must now show, in addition to Phase 4E:
- a visible **Review gate signal surface** section
- readable `coverage_signal`
- readable `stability_signal`
- readable `contradiction_pressure_signal`
- readable `unresolved_watchpoint_signal`
- readable `review_readiness_summary`
- readable `gate_flags`

These surfaces remain additive and do not replace evidence, history, focus, compare, delta, decision, contradiction, challenge, refutation, challenge dossier, challenge dossier delta, challenge dossier review digest, review trace, raw review, or raw candidate surfaces.

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
- no second truth beside the canonical workspace plus separate raw artifacts

Phase 4F is only accepted when:
- the new value stays additive and workspace-derived
- gate signals remain compact and normalized
- readiness stays descriptive rather than imperative
- gate flags stay contextual rather than action-triggering
- the operator, CLI, and HTTP surfaces expose the same canonical Phase 4F signal surface
- Phase 4E does not regress

## Executable proof

Run:

```bash
node tools/verify-mec-phase4f-review-gate-signal-surface.js
```

The proof verifies:
- canonical workspace exposes additive `review_gate_signal_surface`
- a primary candidate exposes normalized gate signal readability
- a counterexample contribution preserves readable gate signal context
- CLI exposes gate and normalized signal readability
- HTTP exposes the same canonical gate object
- the review desk renders the visible Phase 4F signal surface
- existing Phase 4E surfaces do not regress
- no outcome, workflow, ranking, queue, or write-path drift is introduced
