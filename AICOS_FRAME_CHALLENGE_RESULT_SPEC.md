# AICOS Frame Challenge Result Spec

## Purpose

A frame challenge result captures the outcome of challenging a proposed frame with one or more perspective passes.
It is a formal result artifact, not a loose comment pile.

## Boundary

A frame challenge result is:

- local
- shadow-only
- proposal-safe
- non-authoritative

It is not:

- an approval record
- a promotion gate
- a runtime control instruction
- a replacement for the Studio baseline path

## Required fields

A valid challenge result must contain:

- `artifact_type`
- `subject_ref`
- `input_preflight_ref`
- `passes_run`
- `challenge_findings`
- `challenge_outcome`
- `frame_risk_band_after_challenge`
- `residual_risks`
- `recommended_next_move`

## Challenge outcomes

Allowed values are:

- `confirmed`
- `reframed`
- `narrowed`
- `blocked`

### Meaning

- `confirmed` means the original frame largely holds.
- `reframed` means the frame was materially wrong, too broad, or too narrow.
- `narrowed` means the core direction is usable but scope had to shrink.
- `blocked` means further work would mostly produce polished nonsense under the current frame.

## Recommended next move

Allowed values are:

- `proceed`
- `proceed_with_caution`
- `revise_frame`
- `stop`

These remain local advisory outputs only.

## Forbidden content

A challenge result may not contain:

- truth approval claims
- integration authority claims
- runtime actions
- registry write instructions

## Closure

The frame challenge result exists to preserve the outcome of a bounded frame challenge in a comparable, machine-readable, non-authoritative form.
