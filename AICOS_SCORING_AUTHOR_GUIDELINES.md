# AICOS Scoring Author Guidelines

## Status

This artifact defines author-facing calibration guidance for the existing card-level `impact` seeds:

- `impact.value`
- `impact.risk`
- `impact.confidence`

It is a writing and calibration guide.
It is not a new scoring model.
It does not change schema requirements.
It does not introduce runtime scoring.

## Why this exists

The scoring charter and audit interpretation established three things:

1. `impact` is already present across the registry
2. `score_summary` is currently a generated scan convenience layer over `impact`
3. current `value` and `confidence` are top-compressed

This means the next practical improvement is not more formulas.
The next practical improvement is better author calibration.

## Scope

This guide applies when authoring or revising card-level `impact`.

It does not apply to:

- MEC runtime scoring
- memory proposal priority
- memory review confidence
- derived `score_summary`
- future additive axes such as `evidence_strength` or `learning_value`

## First rule: do not treat all three fields as praise

The three current fields answer different questions:

- `value`: how useful, important, or leverage-bearing is this card if the card is actually relevant?
- `risk`: how much harm, drift, failure cost, or downstream damage can occur if this pattern is missed or this idea is misused?
- `confidence`: how justified is the current card statement based on evidence, reproducibility, grounding, and boundedness?

These three fields should not all rise together by default.

## Calibration ranges

The registry uses `0-100`, but authors should think in coarse buckets, not false precision.

### `impact.value`

#### Low: `0-39`

Use when the card is:

- narrow and weakly reusable
- highly situational
- mostly archival
- interesting but low leverage
- not clearly worth surfacing early in a scan

Typical reading:

- useful only in a small corner case
- not harmful to keep, but not important to prioritize

#### Moderate: `40-69`

Use when the card is:

- clearly useful in the right context
- domain-specific or condition-sensitive
- helpful but not broadly decisive
- worth keeping, but not obviously central

Typical reading:

- real value, bounded scope
- should not dominate scan ordering across the whole registry

#### Strong: `70-84`

Use when the card is:

- broadly useful in its domain
- likely to save time, avoid repeat mistakes, or guide action
- reusable beyond a single isolated case

Typical reading:

- genuinely important
- strong card, but not automatically top-tier

#### Very high: `85-94`

Use when the card is:

- repeatedly useful
- high leverage across sessions or projects
- strongly scan-worthy
- likely among the better cards in its area

Typical reading:

- excellent card with clear practical or conceptual utility

#### Exceptional: `95-100`

Reserve for cards that are unusually central.

Use only when the card is:

- foundational across many decisions or domains
- repeatedly decisive in avoiding costly mistakes
- exceptionally compressive as knowledge
- likely to remain important even as the registry grows

Do not use `95-100` for:

- cards you personally like
- fresh ideas that merely feel elegant
- broad philosophical appeal without bounded utility
- ordinary good cards

## `impact.risk`

`risk` is about downside if the pattern is missed, ignored, or misapplied.
It is not a general intensity score.

### Low: `0-19`

Use when failure cost is small.

Typical cases:

- low-stakes preference errors
- ideas that are useful but safe to ignore temporarily
- optional improvements with little downside

#### Reading

- missing this is not great, but usually not dangerous

### Moderate: `20-49`

Use when the card matters, but the downside is bounded.

Typical cases:

- wasted time
- local inefficiency
- moderate confusion
- limited rework

#### Reading

- meaningful cost, but not severe systemic damage

### High: `50-74`

Use when the downside can seriously degrade execution, reliability, focus, or outcome quality.

Typical cases:

- persistent implementation failure
- material architecture drift
- strong strategic misallocation
- repeated avoidable regressions

#### Reading

- this can hurt significantly and should not be brushed aside

### Severe: `75-89`

Use when the downside is major and cross-cutting.

Typical cases:

- chronic non-shipping behavior
- repeated architecture inflation
- high-cost production or decision failures
- system-level damage short of the most critical class

#### Reading

- this is a serious registry warning, not just a strong opinion

### Critical: `90-100`

Reserve for direct or near-direct severe harm.

Typical cases:

- security exposure
- data leakage
- destructive operational behavior
- severe production-impacting failure modes

Do not use `90-100` for:

- general frustration
- broad dislike of a pattern
- abstract complexity concerns unless the harm is concretely severe

## `impact.confidence`

`confidence` should answer: how justified is the current card statement as written?

It is not:

- how much you agree with the card
- how beautiful the idea is
- how much you want the card to be true

### Low: `0-39`

Use when the card is:

- speculative
- weakly grounded
- hard to reproduce
- mostly intuition without evidence

Typical reading:

- maybe interesting, but not yet trustworthy as a strong statement

### Moderate: `40-69`

Use when the card has:

- some real signals
- partial examples
- incomplete evidence
- bounded but still uncertain applicability

Typical reading:

- plausible and useful, but not yet solid

### Strong: `70-84`

Use when the card has:

- concrete examples, logs, references, or repeated observation
- a clear repro or bounded use case
- evidence that supports the claim, even if not exhaustively

Typical reading:

- reasonably well grounded
- healthy default for many good cards

### Very strong: `85-94`

Use when the card has:

- repeated confirmation
- strong alignment between claim and evidence
- clear boundaries and low ambiguity
- reliable usefulness across multiple occurrences

Typical reading:

- strong evidence-backed confidence
- should still remain below the maximum in ordinary cases

### Near-certain: `95-100`

Reserve for statements that are unusually well supported.

Use only when the card has:

- very concrete evidence
- repeated reproducibility
- clear boundedness
- very low unresolved ambiguity

Do not use `95-100` for:

- principle cards merely because they feel foundational
- future-oriented proposals
- cards with broad conceptual appeal but limited concrete proof

## Anti-inflation rules

### 1. Default away from the ceiling

When uncertain, do not choose `90+`.

A healthy default for a good, useful, reasonably grounded card is often:

- `value`: `70-84`
- `risk`: `20-49`
- `confidence`: `70-84`

### 2. `95+` should be rare

Treat `95+` as an exception bucket.
It should remain visibly rare as the registry grows.

### 3. High `value` does not require high `confidence`

A card may be:

- very useful
- but only partially proven

That should often look like:

- high `value`
- moderate `confidence`

### 4. High `risk` does not require high `confidence`

A danger can be serious even while the exact boundaries remain imperfectly known.

That should often look like:

- high `risk`
- moderate or strong, but not maximal, `confidence`

### 5. Principle cards require restraint on `confidence`

Meta or worldview cards may deserve high `value`.
They do not automatically deserve top-tier `confidence` unless they are tightly bounded and well grounded as written.

### 6. Proposed cards require restraint on `confidence`

If a card is future-oriented, exploratory, or schema-expanding, avoid top confidence unless the proposal is unusually well evidenced.

### 7. Do not encode multiple meanings into one field

Avoid using:

- `value` as proof strength
- `confidence` as moral approval
- `risk` as general emotional intensity

## Quick author checklist

Before finalizing `impact`, ask:

1. If this card were relevant, how much leverage would it provide?
2. What happens if this is ignored or applied badly?
3. How concrete is the evidence for the claim as written?
4. Am I using `95+` because it is truly exceptional, or because I simply like the card?
5. Would I defend this score to a later reviewer who has less emotional attachment to the card?

## Calibration examples

### Example A: broad but partially proven pattern

Use shape like:

- `value`: high
- `risk`: moderate
- `confidence`: moderate or strong

Meaning:

- important idea
- real downside if ignored
- but not fully proven in all contexts

### Example B: critical security exposure

Use shape like:

- `value`: high
- `risk`: critical
- `confidence`: strong or very strong

Meaning:

- highly important
- direct harm potential
- serious even if some edge conditions remain open

### Example C: elegant conceptual principle

Use shape like:

- `value`: high or very high
- `risk`: low or moderate
- `confidence`: moderate to strong unless tightly evidenced

Meaning:

- genuinely important as a lens
- but not automatically proof-dense

### Example D: interesting future proposal

Use shape like:

- `value`: moderate or high
- `risk`: low to moderate
- `confidence`: moderate

Meaning:

- promising, possibly useful
- not yet mature enough for inflated certainty

## What this guide does not do

This guide does not:

- backfill existing cards
- require all old cards to be rescaled now
- define future axes like `evidence_strength`
- change `score_summary` formulas
- authorize ranking-based governance

## Recommended author behavior

For now:

- keep using `impact`
- use the bucket language rather than chasing exact precision
- reserve `95+` for rare cases
- separate usefulness from proof strength
- separate harm severity from conceptual importance

## Conclusion

The goal is not numerical perfection.
The goal is better score hygiene.

If authors apply these rules consistently, the registry can reduce top-end compression over time without a disruptive rewrite or a premature scoring overhaul.
