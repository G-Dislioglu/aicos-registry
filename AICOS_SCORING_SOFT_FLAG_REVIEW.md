# AICOS Scoring Soft-Flag Review

## Status

This artifact reviews the current soft-flagged cards surfaced by `tools/check-card-scoring-hygiene.js`.

It does not change card data.
It does not authorize automatic rescaling.
It is a review and triage layer over the existing registry state.

## Scope

This review classifies current soft-flagged cards into three buckets:

1. likely overvaluation
2. justified exception
3. intentional boundary or meta signal

The purpose is to distinguish:

- where the authoring guidelines likely point to real inflation
- where a high score may still be defensible
- where a high score is carrying symbolic or boundary meaning that should not be confused with proof-density

## Current hygiene snapshot

Current repo-wide hygiene check reported:

- checked cards: `94`
- hard failures: `0`
- soft-flagged cards: `21`

Observed flag counts:

- `value_95_plus`: `7`
- `confidence_95_plus`: `8`
- `proposed_high_confidence`: `10`
- `meta_extreme_confidence`: `2`

Interpretation:

- the registry has no structural `impact` breakage
- the remaining issue is score hygiene, not score presence
- the strongest pressure point is high confidence on `proposed` cards

## Review method

This document does not try to relabel every soft-flagged card line by line.
Instead it reviews representative cards for each cluster and derives a triage position.

## Bucket A: likely overvaluation

These are the cards most likely to deserve a future downward adjustment if touched again.

### A1. `proposed_high_confidence` cluster

Representative cards:

- `sol-cross-010`
- `sol-cross-011`
- `sol-cross-012`
- `sol-cross-017`
- `sol-cross-022`
- `sol-cross-025`
- `sol-cross-030`
- `sol-cross-032`
- `sol-cross-035`

Shared pattern:

- status is `proposed`
- confidence is `90+`
- evidence is often cross-link based, conceptual, or compositional
- proof density is usually lower than the confidence implies

### Why this looks inflated

The author guideline explicitly says proposals should stay restrained on `confidence` unless they are unusually well evidenced.
These cards generally read like:

- promising synthesis
- plausible design direction
- useful conceptual bridge

They do not yet read like:

- repeated empirical confirmation
- low ambiguity and tight boundedness
- unusually well-supported proof artifacts

### Recommended interpretation

Default review stance:

- not bad cards
- often high learning value
- but likely too confident for `proposed` status

### Suggested future range if reviewed

For many cards in this cluster, a healthier target would often be:

- `confidence`: `72-84`

Some may remain above that if stronger concrete evidence is added.

## A2. `value_95_plus` on broad future-facing concept cards

Representative cards:

- `sol-cross-008`
- `sol-cross-016`
- `sol-cross-054`

Shared pattern:

- large architectural or cross-domain ideas
- broad scope and strong conceptual ambition
- high interest and possible leverage
- but still wider and more future-facing than their `value` suggests

### Why this looks inflated

The guideline reserves `95+` value for unusually central cards that remain decisive even as the registry grows.
These cards may indeed be important ideas, but several still read as:

- architecture-heavy
- scope-expansive
- partially conjectural

That makes `95+` plausible only in rare cases.
For most such cards, the likely more stable interpretation is:

- strong value
- not necessarily exceptional value

### Suggested future range if reviewed

A healthier default target would often be:

- `value`: `85-92`

## A3. `sol-cross-007`

`sol-cross-007` is the strongest mixed case in the review set.

Current flags:

- `value_95_plus`
- `confidence_95_plus`
- `proposed_high_confidence`

### Reading

This is clearly an important cross-domain anti-complexity pattern.
It is likely highly reusable and high signal.
But as a `proposed` card with `value: 100` and `confidence: 95`, it currently combines:

- exceptional value claim
- near-maximal confidence
- proposed status

That combination is too strong for the current evidence style.

### Classification

Primary bucket:

- likely overvaluation

Secondary note:

- also functions as a boundary signal against complexity inflation

### Suggested future review

If revised without changing its role, a more disciplined profile might be:

- keep `value` high
- reduce `confidence` into the strong but non-maximal zone
- leave the card conceptually central without encoding it as near-certain proof

## Bucket B: justified exception

These are cards whose flags are worth noticing, but not automatically signs of bad calibration.

### B1. `err-frontend-01`

Current soft flag:

- `confidence_95_plus`

Current shape:

- `value: 75`
- `risk: 70`
- `confidence: 95`

### Reading

This card includes:

- concrete repro steps
- concrete symptoms
- concrete code references
- a familiar and bounded failure mode

That makes strong confidence understandable.
The exact value `95` may still be slightly aggressive, but it is much more defensible than the proposed-card cluster.

### Classification

- justified exception

### B2. `sol-audio-02`

Current soft flag:

- `confidence_95_plus`

### Reading

This card is solution-shaped rather than speculative:

- concrete fallback steps
- concrete code references
- production-style notes
- bounded operational surface

The `95` is still high, but semantically it behaves more like a narrow, strongly grounded solution proof than a broad conceptual claim.

### Classification

- justified exception

### B3. `sol-frontend-01` and `sol-ws-01`

Current soft flag:

- `confidence_95_plus`

### Reading

Both cards are concrete, fix-oriented, and tied to clear failure modes with code references.
These are much easier to defend than high-confidence proposals or high-confidence meta cards.

### Classification

- justified exception

### B4. `sol-audio-01`

Current soft flag:

- `value_95_plus`

### Reading

This card is a concrete solution direction for a recurring audio/stability problem.
It is not obviously exceptional across the whole registry, but it may still be perceived as extremely useful inside the affected domain.

### Classification

- borderline case leaning justified exception

### Note

If later normalized, this looks more like a card that might move from `95` to high-but-not-exceptional, rather than a deeply mis-scored card.

## Bucket C: intentional boundary or meta signal

These are cards where the soft flags are real, but the high numbers are carrying a special semantic function.
They should still be interpreted cautiously.

### C1. `meta-003`

Current flags:

- `value_95_plus`
- `confidence_95_plus`
- `meta_extreme_confidence`

### Reading

`meta-003` is a clear governance/safety principle.
It likely deserves high value and broad importance.
But the audit interpretation already showed that meta cards need separate discipline: high principle importance is not the same as dense empirical proof.

### Classification

- intentional boundary/meta signal

### Review stance

Do not treat this as a normal implementation-proof card.
If revised later, the main question is not whether the card is important, but whether `confidence` should encode:

- principle commitment
or
- evidential boundedness

### C2. `meta-006`

Current flags:

- `value_95_plus`
- `confidence_95_plus`
- `meta_extreme_confidence`

### Reading

This card is explicitly philosophical and worldview-level.
Its `100/0/100` profile is not a normal operational score.
It is a symbolic maximum.

### Classification

- intentional boundary/meta signal

### Review stance

This is not a good template for future scoring.
It should be read as:

- worldview anchor
- authorial meta-signal
- non-transferable exception

If the registry later wants stricter epistemic comparability, this is a prime candidate for interpretive separation rather than ordinary rescaling.

## Aggregate conclusion by cluster

### Most likely review-first cluster

- `proposed_high_confidence`

This is the clearest and most actionable cluster.
It directly reflects the authoring guideline concern that proposal cards are currently too often rated with near-proof confidence.

### Secondary review cluster

- broad `value_95_plus` architecture/concept cards

These are less urgent than the confidence-heavy proposal cluster, but still likely contributors to top-end compression.

### Lowest urgency cluster

- concrete fix cards with `confidence_95_plus`

These should be reviewed later and selectively, because several are plausibly defensible exceptions.

### Special handling cluster

- `meta_extreme_confidence`

These should not be treated like ordinary overvaluation cases.
They are better understood as explicit boundary/meta signals.

## Practical next actions

### 1. Review the `proposed_high_confidence` cards first

Recommended order of operations:

- inspect each `proposed_high_confidence` card
- ask whether the card really has repeated, bounded, concrete evidence
- if not, lower `confidence` before touching other fields

### 2. Review `value_95_plus` only after proposal confidence cleanup

Rationale:

- confidence inflation is currently the sharper hygiene issue
- value inflation is real, but less damaging than near-certainty on proposals

### 3. Preserve meta cards as explicit exceptions unless a stronger epistemic split is introduced later

Do not try to normalize worldview cards with the same simple rules used for implementation cards unless the repo adopts a clearer distinction between:

- symbolic importance
- evidential certainty

## Non-goals

This review does not:

- rescore cards automatically
- claim that every soft flag is wrong
- turn the hygiene checker into a policy engine
- merge scoring into MEC or runtime review

## Conclusion

The current soft-flag set is not evidence of scoring failure.
It is evidence of where scoring hygiene now needs human interpretation.

The clearest likely-overvaluation area is:

- high confidence on `proposed` cards

The clearest justified-exception area is:

- concrete fix cards with bounded evidence and code references

The clearest special-case area is:

- meta cards carrying worldview or boundary meaning

That gives a practical triage order without collapsing distinct card meanings into a single correction rule.
