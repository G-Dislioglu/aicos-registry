# MEC Phase 3D Review Desk Acceptance

## Accepted user-visible value

Phase 3D turns the canonical MEC review workspace into a visibly usable MEC Review Desk inside the Operator.

Accepted desk value:
- one visible review desk over the canonical `mec_review_workspace`
- clear workspace summary and segment entrypoints
- queue-style navigation through the currently visible workspace scope
- strong per-candidate desk context
- explicit visual separation between:
  - raw candidate artifact
  - derived review state
  - raw review records
- in-desk use of the existing `stabilize` / `reject` actions only

## Accepted desk surface

The Operator must now behave like a review desk, not just a flatter list/detail page.

Accepted desk behaviors:
- visible workspace summary metrics
- visible facet/segment entrypoints based on real derived workspace signals
- grouped workspace rendering for practical review flow
- next/previous movement inside the current filtered workspace queue
- reproducible desk state via URL query state for selection/filter/facet/sort
- unresolved-reference and missing-detail states remain readable and explicit

## Locked boundaries remain true

Still true:
- canonical MEC review workspace remains the only derived truth for the visible review desk
- raw MEC candidate artifacts remain runtime-only and separate
- raw MEC review records remain separate runtime artifacts
- no registry mutation
- no export/canon promotion
- no new review outcomes
- no reopen/defer/escalate/archive/promote flow
- no queue engine / assignment engine / governance platform

## Executable proof

Run:

```bash
node tools/verify-mec-phase3d-review-desk.js
```

The proof verifies:
- the operator exposes a visible MEC Review Desk on top of the canonical workspace
- grouped queue/facet navigation works over the workspace
- raw candidate artifact, derived review state, and raw review records stay visibly separated
- existing stabilize/reject actions still work in-desk
- the canonical workspace proof from Phase 3C remains green
