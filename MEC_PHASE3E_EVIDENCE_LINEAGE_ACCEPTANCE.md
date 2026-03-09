# MEC Phase 3E Evidence & Lineage Review Context Acceptance

## Accepted user-visible value

Phase 3E turns the MEC Review Desk from a clearly navigable workspace into a denser review decision surface.

Accepted value:
- the desk stays anchored on the canonical `mec_review_workspace`
- no second derived truth is introduced
- raw candidate artifacts remain separate
- raw review records remain separate
- evidence and lineage are made more readable from existing signals
- review history is compressed into a usable decision context
- related candidate context becomes visible when it is derivable from existing linkage or shared-source signals
- the desk explains why a workspace item is reviewable, terminal, or visibly blocked

## Accepted visible surfaces

The review desk must now show, in addition to the Phase 3D desk structure:
- a visible **Why this state** section
- a visible **Evidence / lineage context** section
- a visible **Review history context** section
- a visible **Related candidate context** section

These sections must remain additive to the existing desk and must not replace the raw candidate artifact or raw review record layers.

## Accepted architectural rule

Still true:
- `mec_review_workspace` remains the only canonical derived truth for the desk
- raw candidate artifacts remain raw
- raw review records remain separate raw artifacts
- no new review outcomes
- no governance/workflow platform expansion
- no queue engine, assignments, or orchestration layer
- no registry mutation
- no export/canon promotion
- no new ontology or similarity system

New visible context is only accepted when it is a readable condensation of existing signals already present in runtime candidate artifacts, runtime review records, or canonical workspace derivation.

## Executable proof

Run:

```bash
node tools/verify-mec-phase3e-evidence-lineage.js
```

The proof verifies:
- the canonical workspace exposes additive evidence, history, related-candidate, and state-explanation contexts
- the visible review desk renders those contexts
- stabilize / reject behavior remains minimal and desk-local
- the canonical workspace proof remains green
