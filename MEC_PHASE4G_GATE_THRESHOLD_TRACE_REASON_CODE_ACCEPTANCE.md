# MEC Phase 4G Gate Threshold Trace & Reason-Code Surface Acceptance

## Accepted user-visible value

This block extends the existing Phase 4F review gate signal surface by making the gate bucket explainable: the canonical workspace now exposes structured reason codes, threshold trace, provenance, blockers, concerns, supports, and a compact explanation summary for the current gate read.

Accepted value:
- the desk remains anchored on the canonical `mec_review_workspace`
- a workspace item may now expose additive `review_gate_threshold_trace`
- a primary candidate can show one compact explanation layer for why the current gate bucket reads as it does
- a counterexample contribution can show the same explanation layer without losing its linked primary-candidate context
- reason codes remain compact and reusable
- blockers, concerns, and supports remain descriptive and read-first
- provenance remains traceability only, not a second truth
- no new outcome, recommendation layer, queue engine, or second truth is introduced
- no new write path is introduced

## Accepted visible surfaces

The review desk must now show, in addition to Phase 4F:
- a visible **Gate threshold trace / reason codes** section
- readable `reason_codes`
- readable `blocker_reasons`
- readable `concern_reasons`
- readable `support_reasons`
- readable `threshold_trace`
- readable `signal_provenance_read`
- readable `bucket_explanation_summary`

These surfaces remain additive and do not replace evidence, history, focus, compare, delta, decision, contradiction, challenge, refutation, challenge dossier, challenge dossier delta, challenge dossier review digest, review gate signal surface, review trace, raw review, or raw candidate surfaces.

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

Phase 4G is only accepted when:
- the new value stays additive and workspace-derived
- reason codes remain compact and normalized
- threshold trace stays explanatory rather than imperative
- provenance stays traceability rather than ontology expansion
- the operator, CLI, and HTTP surfaces expose the same canonical Phase 4G trace surface
- Phase 4F does not regress

## Executable proof

Run:

```bash
node tools/verify-mec-phase4g-gate-threshold-trace-reason-code-surface.js
```

The proof verifies:
- canonical workspace exposes additive `review_gate_threshold_trace`
- a primary candidate exposes readable reason codes, threshold trace, provenance, blockers, concerns, supports, and explanation summary
- a counterexample contribution preserves readable threshold trace context
- CLI exposes reason-code readability
- HTTP exposes the same canonical trace object
- the review desk renders the visible Phase 4G trace surface
- existing Phase 4F surfaces do not regress
- no outcome, workflow, ranking, queue, or write-path drift is introduced
