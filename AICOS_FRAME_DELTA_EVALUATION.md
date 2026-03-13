# AICOS Frame Delta Evaluation

## Purpose

Frame Delta Evaluation compares the public Studio baseline against the shadow frame-delta track on the same case without replacing the baseline.
The purpose is comparison, not silent integration.

## Boundary

Frame delta evaluation is:

- local
- experimental
- shadow-only
- non-authoritative

It is not:

- a migration plan
- an approval surface
- a truth override
- an automatic recommendation to adopt Delta

## Comparison axes

The initial comparison must stay small and explicit.
Allowed axes are:

- `misframing_detection`
- `constraint_fidelity`
- `premature_closure_resistance`
- `signal_gap_awareness`
- `actionability_after_challenge`

Each axis records:

- the axis name
- a winner of `baseline`, `delta`, or `tie`
- a short reason

## Overall result

Allowed overall results are:

- `baseline_better`
- `delta_better`
- `mixed`

## Integration signal

Allowed integration signals are:

- `none`
- `promising`
- `strong`

`integration_signal` is descriptive only.
It does not authorize merging Delta into Studio.

## Required posture

Every evaluation must make clear that:

- Delta is a shadow comparison track
- baseline remains intact
- no registry, runtime, or operator action follows from the comparison itself

## Forbidden patterns

The following are forbidden:

- “replace Studio now” claims
- approval or authority language
- numeric master scores implying finality
- runtime or truth mutation implications

## Closure

Frame delta evaluation exists to force disciplined baseline-vs-delta comparison while refusing premature integration and refusing any hidden second authority system.
