# MEC Phase 3F Comparative Review & Focus Acceptance

## Accepted user-visible value

Phase 3F turns the MEC Review Desk from an evidence-rich single-item surface into a comparison-capable and focus-capable review workspace.

Accepted value:
- the desk stays anchored on the canonical `mec_review_workspace`
- no second derived truth is introduced
- raw candidate artifacts remain separate
- raw review records remain separate
- additive `focus_context` condenses real review tension from existing workspace-visible signals only
- additive `compare_context` makes adjacent candidates actually comparable inside the same desk
- comparison stays readable and reversible through desk-local selection and URL state
- focus segmentation remains signal-based and does not become a hidden priority engine

## Accepted visible surfaces

The review desk must now show, in addition to the Phase 3E desk structure:
- a visible **Focus context** section
- a visible **Compare context** section
- visible desk segments that condense focus-worthy workspace objects from canonical signals
- a quick-compare path from the current item to a compare target
- reproducible compare state in the desk URL state

These surfaces must remain additive to the existing desk and must not replace the raw candidate artifact, raw review record, evidence, history, or related-candidate layers.

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
- no hidden ranking or similarity engine

New focus and compare context are only accepted when they are readable condensations of already-visible signals already present in runtime candidate artifacts, runtime review records, or canonical workspace derivation.

## Executable proof

Run:

```bash
node tools/verify-mec-phase3f-comparative-review-focus.js
```

The proof verifies:
- the canonical workspace exposes additive focus and compare contexts
- the visible review desk renders focus and compare surfaces
- compare selection is reproducible through desk URL state
- the canonical workspace proof remains green
- the existing evidence/history/related/state-explanation surfaces do not regress
