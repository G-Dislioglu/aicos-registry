# AICOS Scoring S1 Closure

## Status

S1 scoring is complete as a registry-layer calibration and scan-surface workflow.
It is workflow-ready.
S2 has not started.

## S1 scope

S1 covers only the existing card-level `impact` seeds and their generated scan projection:

- `impact.value`
- `impact.risk`
- `impact.confidence`
- generated `score_summary` in `index/INDEX.json`
- registry-layer audit and hygiene checks
- repo-near manual calibration batches where the existing review line clearly supported live-truth correction

S1 does not redefine the meaning of cards.
It does not introduce runtime scoring.
It does not merge MEC review state into registry truth.

## What S1 built

S1 now includes:

- `AICOS_SCORING_CHARTER.md`
- `AICOS_SCORING_AUDIT_INTERPRETATION.md`
- `AICOS_SCORING_AUTHOR_GUIDELINES.md`
- `AICOS_SCORING_SOFT_FLAG_REVIEW.md`
- `AICOS_SCORING_PROPOSED_HIGH_CONFIDENCE_REVIEW.md`
- `AICOS_SCORING_CALIBRATION_BATCH1.md`
- `AICOS_SCORING_CALIBRATION_BATCH2.md`
- `AICOS_SCORING_CALIBRATION_BATCH3.md`
- `tools/score-lib.js`
- `tools/audit-card-scoring.js`
- `tools/check-card-scoring-hygiene.js`
- `tools/verify-aicos-scoring-surface.js`
- generated scoring projection in `index/INDEX.json`
- a bundled S1 command workflow in `package.json`

## What S1 deliberately did not build

S1 did not build:

- a new scoring formula beyond the existing additive scan projection
- runtime or MEC scoring integration
- promotion automation
- automatic mass rewrites across the registry
- new mandatory schema fields such as `evidence_strength`, `learning_value`, `salvage_potential`, or `drift_risk`
- card-ranking governance or decision policy based on derived scalars
- a Batch 4 card-calibration loop

## Current rest state

Current registry state after Batch 3:

- all `94` cards expose complete `impact`
- `index/INDEX.json` projects normalized `impact` and generated `score_summary`
- scoring hygiene reports `0` hard failures
- one deliberate soft-flag exception remains: `meta-006`

Interpretation:

- `meta-006` remains an intentional meta signal
- it is not a normal template for future scoring
- the S1 scoring line is therefore stabilized, not mathematically closed under every symbolic exception

## Standard checks going forward

For normal scoring-authoring or scoring-review work, the standard S1 checks are:

- `node tools/check-card-scoring-hygiene.js`
- `node tools/audit-card-scoring.js`
- `node tools/generate-index.js`
- `node tools/verify-aicos-scoring-surface.js`
- `npm run check:scoring-s1`

Recommended use:

- run the hygiene check when authoring or revising card scores
- regenerate `index/INDEX.json` whenever card `impact` changes
- run the full S1 bundle before closing a scoring-related block

## What a later S2 would be

A later S2 could add tighter semantics around future additive axes such as:

- `evidence_strength`
- `learning_value`
- `salvage_potential`
- `drift_risk`

A valid S2 would need explicit semantics and boundaries before any broad backfill.

## What is explicitly not part of S1

Not part of S1:

- runtime review scoring
- MEC/operator scoring surfaces
- export or promotion decisions driven by derived score scalars
- automatic reinterpretation of symbolic meta cards as ordinary implementation-proof cards
- a requirement to remove the final `meta-006` exception inside S1

## Closure statement

S1 is complete as a registry-layer scoring workflow.
It is ready to support routine authoring, targeted review, and verification without reopening new card-calibration batches by default.
S2 remains a separate future block and is not started here.
