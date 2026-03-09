# MEC Phase 3G Review Delta & Change Awareness Acceptance

## Accepted user-visible value

Phase 3G turns the MEC Review Desk from a comparison-capable workspace into a time-aware review workspace.

Accepted value:
- the desk stays anchored on the canonical `mec_review_workspace`
- no second derived truth is introduced
- raw candidate artifacts remain separate
- raw review records remain separate
- additive `delta_context` makes visible what changed since the latest visible review anchor or first baseline anchor
- the desk can explain briefly why a renewed look is justified now, or why no stronger movement is visible now
- existing focus and compare surfaces may be sharpened by visible change signals, but do not become a ranking engine
- change-awareness remains signal-based and reproducible from the canonical workspace only

## Accepted visible surfaces

The review desk must now show, in addition to the Phase 3F desk structure:
- a visible **Delta / change context** section
- a visible **Why now / why not now** readability layer inside that delta surface
- visible change-aware desk segments for items showing current review movement or stable anchored state
- additive change-awareness in the candidate list context without replacing existing evidence, history, focus, or compare layers

These surfaces must remain additive to the existing desk and must not replace the raw candidate artifact, raw review record, evidence, history, related-candidate, focus, or compare layers.

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
- no new ontology
- no hidden ranking or priority engine

New delta and why-now/why-not-now context are only accepted when they are readable condensations of already-visible signals present in runtime candidate artifacts, runtime review records, or canonical workspace derivation.

## Executable proof

Run:

```bash
node tools/verify-mec-phase3g-review-delta-change-awareness.js
```

The proof verifies:
- the canonical workspace exposes additive delta/change-awareness context
- the visible review desk renders delta and why-now/why-not-now surfaces
- the existing 3D/3E/3F surfaces do not regress
- the canonical workspace proof remains green
- delta-awareness stays signal-based and desk-local
