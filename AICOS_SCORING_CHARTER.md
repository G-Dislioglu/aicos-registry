# AICOS Scoring Charter v1

## Status

This charter defines a repo-near, non-breaking scoring model for AICOS Registry.

It does not replace live card truth.
It does not introduce automated promotion.
It does not collapse distinct meanings into one universal score.

Guiding rule:

**vector-first, scalar-last**

## Why this exists

The registry already contains scoring seeds in multiple places:

- card `impact.value`
- card `impact.risk`
- card `impact.confidence`
- memory proposal `confidence`
- memory proposal `priority`
- memory review `confidence`
- MEC review `confidence`
- MEC event `priority_score`

At the same time, the main fast-scan path for agents starts with `index/INDEX.json`, and that generated surface currently under-exposes card scoring context unless it is explicitly projected there.

This charter creates a clean scoring frame that:

- preserves card truth in `cards/**`
- preserves `index/INDEX.json` as a generated scan surface
- keeps runtime review scoring separate from registry card scoring
- allows gradual enrichment without forcing fake precision

## Design principles

### 1. Preserve existing `impact`

Existing card-level `impact` remains valid and readable:

- `value`
- `risk`
- `confidence`

These are not removed or renamed.

### 2. Extend compatibly

New score structure must be additive.

No mass rewrite of existing cards is required.
New axes may begin as `null` until they are explicitly authored or derived.

### 3. Separate score layers

AICOS uses three score layers.

#### A. `card_core`

Stable registry-facing card scoring.

Current seeds:

- `value`
- `risk`
- `confidence`

Planned additive axes:

- `evidence_strength`
- `learning_value`
- `salvage_potential`
- `reuse_potential`
- `drift_risk`

#### B. `runtime_review`

Operational review and action scoring.

Examples:

- `review_priority`
- `challenge_pressure`
- `contradiction_pressure`
- `action_readiness`
- `freshness_weight`
- `blocking_weight`

These belong in runtime surfaces, not card truth.

#### C. `learning_intake`

Scoring for partial, risky, exploratory, or distillation-heavy material.

Examples:

- `learning_value`
- `boundary_value`
- `salvage_potential`
- `hallucination_risk`
- `scope_drift_risk`
- `evidence_gap`

These help distinguish:

- useful
- trustworthy
- lehrreich
- risky
- immature
- salvageable

## Derived views

Derived views are surface-specific convenience reads.
They are not a second truth.

Initial derived views:

- `scan_score`
- `trust_score`
- `learning_score`
- `promotion_readiness`

Semantic guardrails:

- useful is not the same as true
- lehrreich is not the same as promotion-ready
- relevant is not the same as trustworthy
- high learning value must not imply high review priority

## Minimal implementation scope for v1

Phase S1 / minimal uplift includes:

1. a scoring library for normalization and lightweight derivation
2. a card scoring audit script
3. generated index projection of existing card `impact`
4. optional generated `score_summary` derived only from existing `impact`

This first block does not:

- add new required card fields
- mutate all cards
- add automated ranking to runtime governance
- merge registry truth with MEC/manual review state

## Index projection rule

`index/INDEX.json` may expose two scoring-related fields:

- `impact`
- `score_summary`

`impact` is a carried card seed.
`score_summary` is a generated convenience read for fast scan.

If `score_summary` is present in v1, it must be clearly understood as:

- derived from existing `impact` only
- non-authoritative
- scan-oriented
- replaceable by richer vector-derived reads later

## Non-breaking extension shape

A future card may optionally carry:

```json
{
  "impact": {
    "value": 88,
    "risk": 75,
    "confidence": 92
  },
  "score_profile": {
    "schema_version": "aicos-score/v1",
    "card_core": {
      "evidence_strength": null,
      "learning_value": null,
      "salvage_potential": null,
      "reuse_potential": null,
      "drift_risk": null
    }
  }
}
```

This is illustrative only.
The current block does not mass-author `score_profile` into existing cards.

## Hard boundaries

- no registry truth replacement
- no automatic canon promotion
- no review automation by score alone
- no single monolithic score as shared truth
- no mass rewrite of all cards
- no style refactor unrelated to scoring
- no mixing this block back into Phase 4J

## Near-term roadmap

### S1

- charter
- audit
- index impact projection
- optional minimal `score_summary`

### S2

- richer `score-lib.js`
- optional additive `score_profile` authoring support
- stronger audit coverage for missing or extreme score seeds

### S3

- carefully map proposal/review/runtime score signals
- keep runtime surfaces separate from registry card truth

### S4

- CLI/UI exposure where genuinely useful

## Acceptance intent for this block

Accepted when:

- scoring language is explicit and bounded
- index fast-scan path can see existing card `impact`
- audit can report coverage, gaps, and obvious extremes
- no existing card schema is broken
- no registry/runtime truth boundary is weakened
