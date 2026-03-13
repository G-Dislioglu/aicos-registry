# AICOS Scoring Proposed High Confidence Review

## Status

This artifact reviews the current `proposed_high_confidence` cluster surfaced by `tools/check-card-scoring-hygiene.js`.

It does not change card data.
It does not authorize automatic rescaling.
It is a manual review layer for the narrowest and most actionable current soft-flag cluster.

## Why this cluster is first

The existing scoring hygiene and soft-flag review already established that the clearest review-first issue is:

- `proposed` cards with `confidence >= 90`

This is the sharpest current calibration risk because high confidence on proposals can make:

- synthesis look like proof
- design direction look like validation
- conceptual elegance look like repeated evidence

## Current cluster

Current `proposed_high_confidence` cards:

- `sol-cross-007`
- `sol-cross-010`
- `sol-cross-011`
- `sol-cross-012`
- `sol-cross-017`
- `sol-cross-022`
- `sol-cross-025`
- `sol-cross-030`
- `sol-cross-032`
- `sol-cross-035`

## Review labels used here

This review uses three narrow per-card outcomes:

- `soften now`
- `soften if touched`
- `borderline but defensible`

Meaning:

- `soften now`: confidence currently looks materially too high for `proposed`
- `soften if touched`: the card likely wants a lower confidence, but not with the same urgency
- `borderline but defensible`: still flagged, but closer to acceptable than the rest of the cluster

## Card-by-card review

### `sol-cross-007`

Current impact:

- `value: 100`
- `risk: 10`
- `confidence: 95`

Reading:

This card captures a strong and reusable anti-complexity pattern.
It has real cross-domain signal.
But it is still a proposal-level synthesis card whose evidence is mostly pattern alignment and conceptual resonance.

Why the current confidence looks too high:

- proposal status remains explicit
- no dense code refs or repeated empirical validation
- `95` pushes the card close to settled truth rather than strong heuristic

Review outcome:

- `soften now`

Suggested future confidence band:

- `78-85`

## `sol-cross-010`

Current impact:

- `value: 85`
- `risk: 15`
- `confidence: 90`

Reading:

This is a coherent architectural proposal linking assumption tracking and parsing validation.
It is plausible and useful.
Its evidence, however, is compositional: it combines existing cards into a stronger integrated layer.

Why the current confidence looks too high:

- integration logic is plausible but not yet shown as repeatedly proven
- evidence is mostly card linkage and conceptual fit

Review outcome:

- `soften now`

Suggested future confidence band:

- `74-82`

## `sol-cross-011`

Current impact:

- `value: 90`
- `risk: 10`
- `confidence: 92`

Reading:

This is a high-trust transparency pattern: mirror plus immutable lineage.
It is strategically strong and probably important in governance-heavy environments.
But it is still a broad proposal with system-level implications and no concrete implementation proof in the card itself.

Why the current confidence looks too high:

- combines two strong ideas into a larger system claim
- benefits are intuitive, but the confidence reads stronger than the bounded evidence

Review outcome:

- `soften now`

Suggested future confidence band:

- `76-84`

## `sol-cross-012`

Current impact:

- `value: 90`
- `risk: 10`
- `confidence: 92`

Reading:

This card has practical force because it introduces explicit time thresholds against over-engineering.
The hard numbers make it feel more concrete than many neighboring cards.
Still, those numbers are a proposed discipline, not a deeply validated universal rule.

Why the current confidence looks too high:

- numeric thresholds create a sense of proof beyond what the evidence supports
- the rule is compelling, but not yet broadly bounded across contexts

Review outcome:

- `soften if touched`

Suggested future confidence band:

- `80-86`

## `sol-cross-017`

Current impact:

- `value: 91`
- `risk: 12`
- `confidence: 90`

Reading:

This is another gating-framework synthesis card.
It turns several existing fail-fast ideas into one unified pre-flight model.
The direction is strong, but the card reads like a reusable design bundle rather than a proven standard.

Why the current confidence looks too high:

- unified framework claim is stronger than the evidence density shown
- concrete numbers help, but remain proposal-level heuristics

Review outcome:

- `soften if touched`

Suggested future confidence band:

- `78-84`

## `sol-cross-022`

Current impact:

- `value: 85`
- `risk: 15`
- `confidence: 90`

Reading:

This is a tidy triad card: provenance, freshness, and security as one verification pattern.
It is sensible and structurally appealing.
But it is also exactly the kind of elegant synthesis that can be scored as more certain than its evidence base warrants.

Why the current confidence looks too high:

- triple-pattern unification is conceptually strong, not yet operationally over-proven
- evidence is largely cross-reference based

Review outcome:

- `soften now`

Suggested future confidence band:

- `74-82`

## `sol-cross-025`

Current impact:

- `value: 90`
- `risk: 12`
- `confidence: 92`

Reading:

This is a strong prioritization rule for constrained builders.
It is highly usable and likely to stay important.
Even so, the card still reads as a disciplined product heuristic rather than as something verified at near-certainty.

Why the current confidence looks too high:

- heavily principle-driven
- evidence is aligned and persuasive, but not unusually deep

Review outcome:

- `soften now`

Suggested future confidence band:

- `78-85`

## `sol-cross-030`

Current impact:

- `value: 92`
- `risk: 10`
- `confidence: 90`

Reading:

This card is more operational than some neighbors because it presents a compact four-gate framework.
It is still, however, a proposed prioritization model for a specific builder context.

Why the current confidence looks too high:

- feels concrete because it is compact, but remains largely heuristic
- strong personal applicability is not the same as broad proof strength

Review outcome:

- `soften if touched`

Suggested future confidence band:

- `80-86`

## `sol-cross-032`

Current impact:

- `value: 82`
- `risk: 10`
- `confidence: 92`

Reading:

This may be the clearest mismatch in the cluster.
The timeout-wrapper pattern is useful and familiar, but the card adds adaptive tuning and broad generality while staying fully proposed.

Why the current confidence looks too high:

- the underlying idea is believable, but `92` is very strong for a proposed generalized wrapper
- the adaptive-threshold part increases uncertainty rather than reducing it

Review outcome:

- `soften now`

Suggested future confidence band:

- `72-80`

## `sol-cross-035`

Current impact:

- `value: 85`
- `risk: 8`
- `confidence: 94`

Reading:

This is a defensive-programming synthesis card unifying parsing, key masking, and provider normalization under external-input handling.
It is probably directionally right.
But `94` is the highest confidence in the cluster while the card remains proposed and largely compositional.

Why the current confidence looks too high:

- the card is broad and unifying, not narrowly proven
- the note itself calls out the unusually high confidence
- the evidence is inherited from neighboring cards rather than shown as direct proof of the unified abstraction

Review outcome:

- `soften now`

Suggested future confidence band:

- `74-82`

## Review order

If this cluster is reviewed manually card by card, the strongest candidates to revisit first are:

1. `sol-cross-007`
2. `sol-cross-035`
3. `sol-cross-032`
4. `sol-cross-010`
5. `sol-cross-011`
6. `sol-cross-022`
7. `sol-cross-025`
8. `sol-cross-012`
9. `sol-cross-017`
10. `sol-cross-030`

Rationale:

- top priority goes to the cards where proposal status and very high confidence diverge most sharply
- slightly lower priority goes to cards whose numerical gates or strong operational compactness make them more defensible

## Aggregate conclusion

This cluster does not look random.
It reflects a recurring pattern:

- strong synthesis cards are being scored closer to proof than to disciplined proposal

That does not make these weak cards.
It means their current `confidence` is often expressing:

- usefulness
- elegance
- resonance
- expected truth

more than:

- unusually bounded evidence
- repeated validation
- low ambiguity across contexts

## Practical recommendation

If a small manual cleanup is done later, the preferred move is:

- lower `confidence` first
- leave `value` mostly alone unless it is also clearly inflated
- do not rewrite card substance unless the card meaning itself is unclear

This preserves the cards' conceptual value while reducing the strongest current calibration distortion.

## Non-goals

This review does not:

- force a rescore now
- claim every card in this cluster is badly written
- introduce a new scoring formula
- promote or demote any card automatically

## Conclusion

The `proposed_high_confidence` cluster remains the cleanest manual review target in the current scoring surface.

Within that cluster, the strongest `soften now` candidates are:

- `sol-cross-007`
- `sol-cross-035`
- `sol-cross-032`
- `sol-cross-010`
- `sol-cross-011`
- `sol-cross-022`
- `sol-cross-025`

The more moderate `soften if touched` candidates are:

- `sol-cross-012`
- `sol-cross-017`
- `sol-cross-030`

That gives a concrete manual review order without turning the hygiene layer into an automatic policy engine.
