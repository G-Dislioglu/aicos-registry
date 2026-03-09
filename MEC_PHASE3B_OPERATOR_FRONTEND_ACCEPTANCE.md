# MEC Phase 3B Operator Frontend Acceptance

## Accepted frontend surface

Phase 3B makes the existing MEC runtime review core visible and minimally usable in the operator shell.

Accepted visible surface:
- candidate list shows derived review state badges
- candidate list supports review-state filtering and lightweight sorting
- candidate detail shows raw runtime artifact alongside derived review state
- candidate detail shows review count and last review outcome
- operator can write the existing Phase 3A outcomes only:
  - `stabilize`
  - `reject`

## Boundaries

Still true:
- raw MEC candidate artifact remains proposal-origin
- review writes create separate runtime review records
- no registry mutation
- no export/canon behavior
- no broad governance UI
- no new review outcomes

## Executable proof

Run:

```bash
node tools/verify-mec-phase3b-operator-frontend.js
```

This proof verifies:
- review state is visible in the operator list/detail surface
- stabilize/reject are usable from the operator frontend path
- terminal reviewed candidates disable further review writes in the frontend
- raw candidate artifacts remain separate from derived review state
- registry files remain unchanged via the underlying runtime proof chain
