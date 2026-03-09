# MEC Phase 3C Canonical Review Workspace Acceptance

## Accepted workspace surface

Phase 3C establishes one canonical derived MEC review workspace over runtime MEC candidate artifacts plus runtime MEC review records.

Accepted workspace properties:
- canonical derived workspace item per MEC candidate
- explicit separation between:
  - raw candidate artifact
  - derived operational review workspace state
- derived workspace includes at least:
  - candidate identity
  - candidate type
  - source linkage
  - current derived review state
  - latest review outcome
  - review count / review summary
  - freshness
  - unresolved runtime-reference risks
  - reviewable / terminal
  - minimal control readiness

## Accepted exposures

The same canonical workspace semantics are exposed read-first via:
- CLI
- HTTP
- Operator

The operator may stay minimal, but it must read the same workspace as the CLI and HTTP surfaces.

## Boundaries remain locked

Still true:
- raw MEC candidate artifacts remain runtime-only and proposal-origin
- raw MEC review records remain separate runtime artifacts
- no registry mutation
- no export/canon promotion
- no additional review outcomes
- no task board / governance platform / institutional queue
- no broad UI architecture shift

## Executable proof

Run:

```bash
node tools/verify-mec-phase3c-review-workspace.js
```

The proof verifies:
- workspace derives from candidate + review records
- CLI / HTTP / Operator expose the same workspace semantics
- derived state, latest outcome, and counts are consistent
- raw candidate artifact remains proposal-origin and separate
- registry files remain unchanged
- no export/canon behavior is introduced
