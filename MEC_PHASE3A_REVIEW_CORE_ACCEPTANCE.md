# MEC Phase 3A Review Core Acceptance

## Accepted runtime surface

Phase 3A adds a runtime-only MEC review core for MEC candidates.

Accepted outcomes in this batch:
- `stabilize`
- `reject`

Boundaries:
- raw MEC candidate artifact remains proposal-origin
- review records are stored as separate runtime artifacts
- current review state is derived in read models
- no registry mutation
- no export/canon behavior

## Executable proof

Run:

```bash
node tools/verify-mec-phase3a-review-core.js
```

This proof verifies:
- MEC review records can be created
- `stabilize` and `reject` can be applied
- candidate read models expose derived current review state
- raw candidate files remain proposal-only runtime artifacts
- CLI and HTTP review surfaces work
- operator detail/list surfaces expose read-first review state
- registry files remain unchanged

## Runtime review core surface

CLI:
- `node tools/arena.js review-mec-candidate <candidate_id> --review-outcome <outcome> --review-rationale "..."`
- `node tools/arena.js list-mec-reviews`
- `node tools/arena.js get-mec-review <review_id>`

HTTP:
- `POST /arena/mec-candidates/:id/reviews`
- `GET /arena/mec-reviews`
- `GET /arena/mec-reviews/:id`

Operator:
- candidate list exposes derived review state badges
- candidate detail exposes read-first derived review state cards
- no broad review control surface is added in the operator

## Open for later Phase 3 steps

Not included here:
- `needs_more_evidence`
- `keep_local`
- `reopen`
- broad review workflow/governance semantics
- export/canon proximity
