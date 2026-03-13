# AICOS Scoring Calibration Batch 3

## Status

This artifact captures the third manual scoring calibration batch applied on top of the existing scoring review line:

- `AICOS_SCORING_AUDIT_INTERPRETATION.md`
- `AICOS_SCORING_AUTHOR_GUIDELINES.md`
- `AICOS_SCORING_SOFT_FLAG_REVIEW.md`
- `AICOS_SCORING_PROPOSED_HIGH_CONFIDENCE_REVIEW.md`
- `AICOS_SCORING_CALIBRATION_BATCH1.md`
- `AICOS_SCORING_CALIBRATION_BATCH2.md`

This batch is intentionally narrow.
It only addresses the final remaining soft-flag rest set after Batch 2 and makes an explicit per-card decision for the two meta exceptions.

## Batch rule

For this batch:

- the remaining meta rest set was reviewed card by card
- `impact.confidence` remained the primary calibration field
- `impact.value` was only changed where the remaining exceptional-value signal still looked inflated under the existing review line
- `impact.risk` was left unchanged
- no titles, essence, tags, steps, tradeoffs, evidence, links, schema, or formulas were changed
- no runtime, MEC, operator, runner, or scoring-mechanic files were changed

## Starting rest set

Before Batch 3, the hygiene check reported:

- `soft-flagged cards`: `2`
- `value_95_plus`: `2`
- `confidence_95_plus`: `2`
- `meta_extreme_confidence`: `2`
- `hard failures`: `0`

Remaining cards:

- `meta-003`
- `meta-006`

## Card decisions

### `meta-003`

- old: `impact { value: 95, risk: 5, confidence: 95 }`
- new: `impact { value: 93, risk: 5, confidence: 92 }`
- reason: this remains a strong governance/safety principle, but its previous profile still encoded principle importance too close to exceptional value and near-certain evidence
- classification: `softened now`

### `meta-006`

- retained unchanged: `impact { value: 100, risk: 0, confidence: 100 }`
- reason: this card continues to function as an explicit worldview anchor and symbolic maximum rather than as a transferable evidence-sensitive template
- classification: `retained as intentional meta signal`

## Batch note

This batch does not try to erase the existence of meta exceptions.
It narrows the remaining exception zone to a single explicit worldview card while bringing the more operational governance principle back into the very-high rather than maximal range.

## Intended effect

This batch is meant to:

- reduce the remaining meta soft-flag rest set without flattening explicit symbolic boundary cards mechanically
- clarify that governance principles may stay very important without automatically remaining in the exceptional-value and near-certain-confidence buckets
- leave the registry with a single deliberate meta scoring exception rather than a diffuse unresolved remainder
