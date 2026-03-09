# MEC Phase 3I Review Action Rationale Snapshot & Trace Acceptance

## Accepted user-visible value

Phase 3I closes the gap between visible MEC desk analysis and the actual runtime review write.

Accepted value:
- the desk still operates from the canonical `mec_review_workspace`
- `stabilize` and `reject` do not just write an outcome
- each runtime review write now preserves a compact, signal-based rationale snapshot of the visible desk situation at write time
- the canonical workspace exposes an additive `review_trace_context` that makes the last review action readable after the fact
- raw review records remain separate runtime artifacts
- no recommendation engine, governance system, workflow engine, or new outcome semantics are introduced

## Accepted visible surfaces

The review desk must now show, in addition to Phase 3H:
- a visible **Review action trace** section
- readable post-decision trace output showing:
  - decision readiness at write
  - support signals at write
  - friction signals at write
  - missing signals at write
  - contradiction signals at write
  - why-now / why-not-now context at write
  - delta bucket at write
- raw review records that remain separately visible and still expose the stored runtime artifact, including the minimal rationale snapshot carried by the write

These surfaces remain additive and do not replace the existing evidence, history, focus, compare, delta, decision, contradiction, raw review, or raw candidate surfaces.

## Accepted architectural rule

Still true:
- `mec_review_workspace` remains the only canonical derived truth
- raw review records remain raw runtime review artifacts
- raw candidate artifacts remain proposal-origin artifacts
- no new review outcomes
- no registry mutation
- no export/canon promotion
- no workflow/governance/assignment platform
- no reopen/escalate engine
- no recommendation engine
- no ranking or scoring machine
- no hidden truth beside workspace + raw review records

The write-time rationale snapshot is only accepted when it is a compact, signal-based condensation of already visible desk context and remains minimal.

## Executable proof

Run:

```bash
node tools/verify-mec-phase3i-review-action-rationale-snapshot-trace.js
```

The proof verifies:
- MEC review writes capture a minimal signal-based rationale snapshot
- the canonical workspace exposes additive `review_trace_context`
- the review desk renders a visible post-decision review trace surface
- raw review records preserve the stored rationale snapshot
- previous 3D–3H surfaces do not regress
- no outcome, workflow, or recommendation drift is introduced
