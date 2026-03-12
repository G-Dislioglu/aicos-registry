# AICOS Scoring Audit Interpretation

## Status

This artifact interprets the current scoring v1 audit.

It is not a new scoring model.
It is a calibration and outlier-reading layer over the existing `impact` seeds and the generated `score_summary` projection.

## Scope of interpretation

This document reads the current S1 state:

- `impact.value`
- `impact.risk`
- `impact.confidence`
- generated `score_summary`
- representative outlier cards

It does not authorize:

- new mandatory score fields
- runtime/review scoring merge into registry truth
- automatic promotion or canon decisions
- a monolithic intelligence score

## Confirmed S1 baseline

Current audit-reported state:

- cards: `94`
- cards with `impact`: `94`
- cards with complete `impact`: `94`
- cards with generated `score_summary`: `94`
- index projection gaps: `0`

Interpretation:

- the repo already has full first-pass score seed coverage
- the immediate problem is no longer missingness
- the immediate problem is calibration quality

## Distribution picture

Observed from `index/INDEX.json`:

### `impact.value`

- min: `40`
- p25: `84`
- median: `88`
- p75: `90`
- max: `100`
- average: `84.02`

Buckets:

- `<50`: `2`
- `50-69`: `8`
- `70-84`: `15`
- `85-100`: `69`

Interpretation:

- value is heavily compressed toward the top end
- current registry culture assigns high usefulness broadly
- `value` already acts more like "important / worth keeping" than a sharply discriminative score

### `impact.risk`

- min: `0`
- p25: `10`
- median: `18`
- p75: `30`
- max: `95`
- average: `25.38`

Buckets:

- `<50`: `79`
- `50-69`: `8`
- `70-84`: `6`
- `85-100`: `1`

Interpretation:

- risk is meaningfully spread, but mostly low
- high-risk cards exist, but they are sparse and likely semantically special
- risk appears more selective than value

### `impact.confidence`

- min: `70`
- p25: `82`
- median: `85`
- p75: `90`
- max: `100`
- average: `85.66`

Buckets:

- `<50`: `0`
- `50-69`: `0`
- `70-84`: `31`
- `85-100`: `63`

Interpretation:

- confidence is also top-compressed
- there is almost no low-confidence zone in the current registry
- current `confidence` behaves closer to "author belief / registry readiness" than to strict evidential confidence

## Consequence for `score_summary`

Because S1 `score_summary` is derived only from `impact`, it inherits the current seed culture.

This means:

- `scan_score` is useful for fast ordering
- `trust_score` is useful as a coarse contrast against risk
- `learning_score` is currently only a convenience read, not a true learning axis
- `promotion_readiness` is not yet an epistemic promotion signal

The generated summary is therefore valid as a scan surface, but not yet valid as a strong governance or truth-quality surface.

## Outlier map

### A. Top scan-score outliers

Representative cards:

- `meta-006`
- `sol-cross-007`
- `meta-003`
- `sol-bio-051`
- `sol-arch-004`

Interpretation:

#### `meta-006`

`impact = { value: 100, risk: 0, confidence: 100 }`

This is a philosophical/foundational meta card with maximal valuation.

Reading:

- strong symbolic or worldview importance
- low operational risk because it is principle-level
- not a good template for future evidence-sensitive scoring

Calibration implication:

- meta/foundational cards may need a different reading frame than implementation cards
- future `evidence_strength` must not be inferred from high `value` on principle cards

#### `sol-cross-007`

`impact = { value: 100, risk: 10, confidence: 95 }`

This card expresses a strong cross-domain anti-complexity principle.

Reading:

- high usefulness and broad applicability
- confidence appears belief-strong but not necessarily empirically benchmarked
- good example of why cross-domain elegance can score high without being a proof-heavy artifact

Calibration implication:

- future `reuse_potential` may be high
- future `evidence_strength` should remain separate

#### `meta-003`

`impact = { value: 95, risk: 5, confidence: 95 }`

This is a safety/governance principle with clear operational value.

Calibration implication:

- strong candidate for high `reuse_potential`
- may justify high `evidence_strength` only if backed by concrete operational references, not by principle status alone

#### `sol-bio-051`

`impact = { value: 93, risk: 8, confidence: 90 }`

This card already contains a useful hint for future axis logic: high risk requires stronger evidence.

Calibration implication:

- good bridge card between conceptual novelty and future evidence scoring
- likely high `learning_value`
- not automatically high `promotion_readiness`

#### `sol-arch-004`

`impact = { value: 90, risk: 10, confidence: 92 }`

A strong prioritization rule with practical solo-builder value.

Calibration implication:

- likely high `reuse_potential`
- evidence base is practical rather than formal
- future `evidence_strength` should remain moderate unless supported by repeated, concrete proof

### B. High-risk outliers

Representative cards:

- `err-auth-01`
- `err-arch-001`
- `err-audio-01`
- `err-audio-02`
- `err-dev-002`

Detailed read of checked examples:

#### `err-auth-01`

`impact = { value: 90, risk: 95, confidence: 80 }`

This is a real security exposure pattern.

Reading:

- very high downstream harm if ignored
- confidence is not maximal, but the concrete failure mode is still serious
- this is a correct use of high risk

Calibration implication:

- high risk should remain reserved for material with direct security, data, or production harm
- future `drift_risk` is not the same thing as operational harm risk

#### `err-arch-001`

`impact = { value: 88, risk: 75, confidence: 92 }`

This is a structural/product risk, not a direct exploit/security issue.

Reading:

- high strategic harm through focus loss and non-shipping behavior
- semantically different from `err-auth-01`

Calibration implication:

- current `risk` mixes different meanings:
  - operational harm
  - strategic/product harm
  - architecture drift harm
- future scoring should split these meanings instead of forcing them into one number

### C. Low-confidence outliers

Representative cards:

- `err-api-01`
- `sol-trading-001`
- `err-ui-01`
- `sol-audio-01`
- `sol-cross-039`

Detailed read of checked examples:

#### `err-api-01`

`impact = { value: 88, risk: 60, confidence: 70 }`

Reading:

- clearly useful and grounded in an observed integration issue
- confidence is appropriately lower because provider behavior and routing context can vary

Calibration implication:

- this looks like a healthy low-confidence example
- future `evidence_strength` could still be moderate if the logs and repro are concrete

#### `sol-trading-001`

`impact = { value: 78, risk: 40, confidence: 72 }`

Reading:

- domain-specific and condition-sensitive
- lower confidence feels appropriate because it depends on market regime and context fit

Calibration implication:

- a good example where `learning_value` and `reuse_potential` may differ strongly
- domain fit should matter more than universal confidence

#### `sol-cross-039`

`impact = { value: 78, risk: 18, confidence: 75 }`

This is a proposed schema/genealogy extension.

Reading:

- interesting and potentially useful
- low-to-mid confidence is appropriate because it is future-oriented and complexity-bearing

Calibration implication:

- a very strong candidate for future `salvage_potential`
- should not be prematurely elevated by broad philosophical appeal alone

## Main calibration findings

### 1. Current `value` is broad, not selective

`value` currently answers something like:

- worth keeping
- important to the authoring worldview
- broadly useful or meaningful

It does not yet sharply answer:

- strongest evidence
- safest to promote
- most reusable under bounded conditions

### 2. Current `confidence` is partly evidential, partly authorial

Current `confidence` appears to mix:

- observed proof strength
- author conviction
- conceptual clarity
- registry readiness

This is workable for S1 scan purposes.
It is not yet clean enough to stand in for future `evidence_strength`.

### 3. Current `risk` mixes multiple harm types

Current `risk` appears to combine:

- security/operational harm
- strategic focus loss
- architecture complexity harm
- implementation drift risk

This is one of the most important reasons not to over-interpret current `promotion_readiness`.

### 4. Meta and principle cards need separate interpretation discipline

Meta cards can legitimately have:

- very high value
- low operational risk
- high confidence

But that does not imply:

- strong empirical grounding
- implementation readiness
- promotion priority

Future scoring must keep principle importance distinct from proof density.

## Rules for future axis calibration

### `evidence_strength`

Should measure:

- concreteness of evidence
- repro clarity
- code/log/reference grounding
- repeatability
- falsifiability

Should not be inferred mainly from:

- philosophical elegance
- author certainty
- broad applicability alone

### `learning_value`

Should measure:

- how much a card teaches even when not promotion-ready
- whether it compresses an important pattern
- whether it helps avoid repeated confusion

High `learning_value` may coexist with:

- lower confidence
- higher risk
- incomplete proof

### `salvage_potential`

Should measure:

- whether an immature/proposed card contains a recoverable core insight
- whether the idea could become strong with better evidence or narrower scope

Good candidate examples are forward-looking or complexity-heavy proposals that are not yet promotion-grade.

### `drift_risk`

Should measure:

- risk of scope expansion
- ontology creep
- architecture inflation
- governance ambiguity

It should remain distinct from:

- security severity
- operational outage risk
- product-market strategy risk

## Recommended S2 boundaries

The next block should stay interpretive and calibration-focused.

Recommended scope:

1. preserve S1 `score_summary` as a scan convenience layer
2. add a tighter audit lens for seed inflation/compression
3. define authoring heuristics for future axes
4. maybe add non-authoritative audit flags such as:
   - `value_confidence_gap`
   - `high_value_low_evidence_candidate`
   - `high_risk_requires_evidence_review`
   - `proposal_salvage_candidate`

Recommended non-scope:

- no mass rewrite of card scores
- no automatic backfill of future axes into all cards
- no runtime scoring merge
- no promotion logic based on derived scalar outputs

## Conclusion

S1 is successful because it makes scoring visible where agents actually scan first.

The next quality bottleneck is not missing math.
The next quality bottleneck is semantic calibration of the existing seeds.

Therefore the correct next move is:

- read outliers
- classify score meanings more cleanly
- define future axes with explicit semantics
- only then extend the scoring model
