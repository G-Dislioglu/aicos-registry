# AICOS Frame Delta Comparative Calibration Batch 1 Report

## Scope

Batch 1 compares the existing Studio baseline against the shadow frame-delta track on exactly 9 cases:

- 6 baseline-near cases
- 3 deliberately frame-risk cases

This report is evidence-only.
It is not an integration recommendation.
It is not a bridge plan.
It is not a replacement claim for the Studio baseline.

## Case list and outcomes

### Baseline-near cases

- `batch1-01-idea-to-proposal-primary` => `baseline_better`
- `batch1-02-idea-to-proposal-boundary-variant` => `mixed`
- `batch1-03-idea-to-handoff-primary` => `baseline_better`
- `batch1-04-idea-to-handoff-boundary-variant` => `delta_better`
- `batch1-05-contradiction-to-review-primary` => `mixed`
- `batch1-06-review-to-bundle-primary` => `mixed`

### Frame-risk cases

- `batch1-07-ambiguous-governance-ask` => `delta_better`
- `batch1-08-over-clean-product-brief` => `mixed`
- `batch1-09-false-consensus-repair` => `mixed`

## Outcome distribution

- `baseline_better`: 2
- `delta_better`: 2
- `mixed`: 5

## Axis distribution

### `misframing_detection`

- `baseline`: 2
- `delta`: 2
- `tie`: 5

### `constraint_fidelity`

- `baseline`: 0
- `delta`: 5
- `tie`: 4

### `premature_closure_resistance`

- `baseline`: 1
- `delta`: 6
- `tie`: 2

### `signal_gap_awareness`

- `baseline`: 0
- `delta`: 6
- `tie`: 3

### `actionability_after_challenge`

- `baseline`: 2
- `delta`: 0
- `tie`: 7

## Pattern readout

### Where baseline stays stronger

The baseline remains stronger on already well-bounded, constraint-explicit cases where shadow pressure mostly restates rules that are already visible.
That pattern appears most clearly in the primary `idea-to-proposal` and primary `idea-to-handoff` cases.

### Where delta shows value

Delta shows the clearest value where:

- a bounded artifact name can be overread as stronger downstream readiness,
- a governance request hides authority expectations,
- a coherent review flow risks compressing unresolved disagreement,
- or polished packaging encourages borrowed certainty.

### Where results stay mixed

Most cases remain mixed.
That means Delta often improves framing caution or signal-gap visibility without fully outperforming the baseline on the full case.

## Non-conclusions

This batch does **not** justify:

- automatic integration of Delta into Studio
- any bridge from Delta into authority surfaces
- any replacement claim against the Studio baseline
- any change to Studio schemas or `verify:studio`

## Evidence after Batch 1

Batch 1 shows that Delta can add real value on frame-risk and interpretation-drift cases, especially on premature closure resistance and signal-gap awareness.
It also shows that Delta does not automatically outperform the baseline on already disciplined baseline paths.

## Next-step discipline

If further work happens after Batch 1, it should preserve the same rule:

- more evidence first
- no automatic integration signal
- no bridge recommendation without further batches
