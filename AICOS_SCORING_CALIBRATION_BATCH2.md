# AICOS Scoring Calibration Batch 2

## Status

This artifact captures the second manual scoring calibration batch applied on top of the existing scoring review line:

- `AICOS_SCORING_AUDIT_INTERPRETATION.md`
- `AICOS_SCORING_AUTHOR_GUIDELINES.md`
- `AICOS_SCORING_SOFT_FLAG_REVIEW.md`
- `AICOS_SCORING_PROPOSED_HIGH_CONFIDENCE_REVIEW.md`
- `AICOS_SCORING_CALIBRATION_BATCH1.md`

This batch is intentionally larger than Batch 1, but still manual and repo-near.
It reviews the remaining current soft-flag clusters and only applies changes where the existing review line clearly supports them.

## Batch rule

For this batch:

- remaining `proposed_high_confidence` cards were manually softened on `impact.confidence`
- clearly review-supported `value_95_plus` cards were manually normalized on `impact.value`
- concrete fix cards with `confidence_95_plus` were reviewed conservatively and softened only from near-certain to very-strong confidence
- `impact.risk` was left unchanged for every card in this batch
- no titles, tags, evidence, steps, links, schema, or scoring formulas were changed
- no runtime, MEC, operator, or runner files were changed

## Card changes

### `sol-cross-007`

- old: `impact { value: 100, risk: 10, confidence: 84 }`
- new: `impact { value: 94, risk: 10, confidence: 84 }`
- reason: still reads as a very strong cross-domain anti-complexity pattern, but `100` kept it in the exceptional-value bucket after Batch 1
- classification: `value normalized`

### `sol-cross-008`

- old: `impact { value: 95, risk: 30, confidence: 80 }`
- new: `impact { value: 90, risk: 30, confidence: 80 }`
- reason: promising frontend/agent guard pattern with strong leverage, but still broad and future-facing rather than exceptional across the whole registry
- classification: `value normalized`

### `sol-cross-012`

- old: `impact { value: 90, risk: 10, confidence: 92 }`
- new: `impact { value: 90, risk: 10, confidence: 84 }`
- reason: the hard-number gate remains useful, but the proposal is better represented as strongly grounded rather than near-certain
- classification: `softened if touched`

### `sol-cross-016`

- old: `impact { value: 95, risk: 25, confidence: 82 }`
- new: `impact { value: 92, risk: 25, confidence: 82 }`
- reason: ambitious governance-stack synthesis with high conceptual value, but not yet stable enough for the exceptional-value bucket
- classification: `value normalized`

### `sol-cross-017`

- old: `impact { value: 91, risk: 12, confidence: 90 }`
- new: `impact { value: 91, risk: 12, confidence: 84 }`
- reason: strong pre-flight framework direction, but still a reusable design bundle rather than a near-proven standard
- classification: `softened if touched`

### `sol-cross-030`

- old: `impact { value: 92, risk: 10, confidence: 90 }`
- new: `impact { value: 92, risk: 10, confidence: 85 }`
- reason: compact and operational, but still a proposed prioritization heuristic rather than a near-certain result
- classification: `softened if touched`

### `sol-cross-054`

- old: `impact { value: 95, risk: 37, confidence: 82 }`
- new: `impact { value: 92, risk: 37, confidence: 82 }`
- reason: important mechanism-design card with active relevance, but still too architecture-heavy and future-facing for `95+` value
- classification: `value normalized`

### `sol-audio-01`

- old: `impact { value: 95, risk: 25, confidence: 75 }`
- new: `impact { value: 92, risk: 25, confidence: 75 }`
- reason: borderline justified exception, but `95` overstated exceptional registry-wide value for an otherwise concrete domain fix
- classification: `conservative value normalization`

### `err-frontend-01`

- old: `impact { value: 75, risk: 70, confidence: 95 }`
- new: `impact { value: 75, risk: 70, confidence: 92 }`
- reason: bounded repro and code references justify very strong confidence, but `95` remained slightly too close to near-certain
- classification: `conservative confidence normalization`

### `err-ws-01`

- old: `impact { value: 65, risk: 50, confidence: 95 }`
- new: `impact { value: 65, risk: 50, confidence: 92 }`
- reason: concrete long-session leak pattern with usable evidence, but still better expressed as very strong rather than near-certain
- classification: `conservative confidence normalization`

### `sol-audio-02`

- old: `impact { value: 85, risk: 20, confidence: 95 }`
- new: `impact { value: 85, risk: 20, confidence: 93 }`
- reason: production-style fallback remains highly defensible, but the previous score slightly overstated certainty
- classification: `conservative confidence normalization`

### `sol-frontend-01`

- old: `impact { value: 75, risk: 5, confidence: 95 }`
- new: `impact { value: 75, risk: 5, confidence: 93 }`
- reason: clear fix card with concrete code references, but no longer needs the near-certain bucket
- classification: `conservative confidence normalization`

### `sol-ws-01`

- old: `impact { value: 65, risk: 10, confidence: 95 }`
- new: `impact { value: 65, risk: 10, confidence: 93 }`
- reason: long-session lifecycle fix remains strongly grounded, but `95` was still more aggressive than needed
- classification: `conservative confidence normalization`

## Deliberate non-changes

### `meta-003`

- left unchanged: `impact { value: 95, risk: 5, confidence: 95 }`
- reason: this remains an intentional boundary/meta signal rather than a normal implementation-proof card
- stance: reviewed in Batch 2, but deliberately deferred instead of being normalized mechanically

### `meta-006`

- left unchanged: `impact { value: 100, risk: 0, confidence: 100 }`
- reason: this remains an explicit worldview anchor and symbolic maximum, not a transferable template for ordinary card scoring
- stance: reviewed in Batch 2, but deliberately deferred instead of being normalized mechanically

## Batch note

This batch closes the remaining clearly supported proposal-confidence and exceptional-value cleanup without introducing a new scoring system.
It also reviews the concrete-fix `confidence_95_plus` cluster conservatively instead of treating it like the proposal cluster.

## Intended effect

This batch is meant to:

- clear the remaining `proposed_high_confidence` cluster
- reduce exceptional-value overuse outside the explicit meta exception zone
- bring concrete fix cards out of the near-certain bucket while preserving their strong evidence profile
- leave meta/boundary cards visible as explicit interpretive exceptions rather than flattening them mechanically
