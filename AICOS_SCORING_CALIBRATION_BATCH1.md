# AICOS Scoring Calibration Batch 1

## Status

This artifact captures the first manual scoring calibration batch applied on top of the existing scoring review line:

- `AICOS_SCORING_AUDIT_INTERPRETATION.md`
- `AICOS_SCORING_AUTHOR_GUIDELINES.md`
- `AICOS_SCORING_SOFT_FLAG_REVIEW.md`
- `AICOS_SCORING_PROPOSED_HIGH_CONFIDENCE_REVIEW.md`

This batch is intentionally narrow.
It only applies live-truth corrections to the prioritized `proposed_high_confidence` subset selected for Batch 1.

## Batch rule

For this batch:

- only the seven prioritized `proposed_high_confidence` cards were touched
- only `impact.confidence` was changed
- `impact.value` and `impact.risk` were left unchanged
- no titles, tags, evidence, steps, links, schema, or scoring formulas were changed

## Card changes

### `sol-cross-007`

- old: `impact { value: 100, risk: 10, confidence: 95 }`
- new: `impact { value: 100, risk: 10, confidence: 84 }`
- reason: strong cross-domain anti-complexity signal, but still proposal-level synthesis rather than near-settled proof
- classification: `softened now`

### `sol-cross-035`

- old: `impact { value: 85, risk: 8, confidence: 94 }`
- new: `impact { value: 85, risk: 8, confidence: 82 }`
- reason: useful defensive-programming unification, but the previous confidence overstated certainty for a compositional proposal
- classification: `softened now`

### `sol-cross-032`

- old: `impact { value: 82, risk: 10, confidence: 92 }`
- new: `impact { value: 82, risk: 10, confidence: 80 }`
- reason: the wrapper pattern is plausible, but the generalized adaptive-threshold proposal was too confident as written
- classification: `softened now`

### `sol-cross-010`

- old: `impact { value: 85, risk: 15, confidence: 90 }`
- new: `impact { value: 85, risk: 15, confidence: 82 }`
- reason: coherent architecture proposal, but evidence remains mainly integrative and conceptual rather than deeply proven
- classification: `softened now`

### `sol-cross-011`

- old: `impact { value: 90, risk: 10, confidence: 92 }`
- new: `impact { value: 90, risk: 10, confidence: 84 }`
- reason: strategically strong governance direction, but broader system claims were scored too close to proof
- classification: `softened now`

### `sol-cross-022`

- old: `impact { value: 85, risk: 15, confidence: 90 }`
- new: `impact { value: 85, risk: 15, confidence: 82 }`
- reason: elegant triad pattern, but the unified abstraction was more certain than the evidence density supported
- classification: `softened now`

### `sol-cross-025`

- old: `impact { value: 90, risk: 12, confidence: 92 }`
- new: `impact { value: 90, risk: 12, confidence: 84 }`
- reason: strong prioritization heuristic, but principle strength was previously encoded too close to near-certainty
- classification: `softened now`

## Batch note

No card in this batch was left unchanged.
All seven selected cards were already the highest-priority `proposed_high_confidence` correction targets from the existing review line.

## Intended effect

This batch is meant to:

- reduce proposal confidence inflation
- preserve conceptual value without rewriting card meaning
- lower the `proposed_high_confidence` flag pressure without introducing a new scoring system
