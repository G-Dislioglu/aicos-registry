# AICOS Studio Conversion Matrix

## Status

This document defines bounded conversions across existing AICOS Studio artifact kinds.
It is a local proposal-layer transformation discipline only.
It does not define routing, runtime execution, or truth mutation.

## Purpose

The conversion matrix exists to make a narrow set of allowed Studio artifact transitions explicit.
It allows useful local preparation without opening an engine or approval surface.

## Allowed source and target logic

### `studio_intake_packet`

Allowed conversions:

- `studio_intake_packet -> proposal_artifact`
- `studio_intake_packet -> reference_artifact`

Gated conversions:

- `studio_intake_packet -> handoff_artifact`
- `studio_intake_packet -> card_review_target_artifact`

The gated conversions remain local and must satisfy bounded source-field and posture checks.

### Normalize-only targets

The following artifact kinds may normalize into themselves only:

- `proposal_artifact -> proposal_artifact`
- `handoff_artifact -> handoff_artifact`
- `reference_artifact -> reference_artifact`
- `card_review_target_artifact -> card_review_target_artifact`
- `review_record -> review_record`
- `gate_report -> gate_report`
- `studio_bundle_manifest -> studio_bundle_manifest`

## Forbidden targets

The conversion layer must reject any attempt to convert directly into:

- runtime review objects
- runtime state
- registry truth
- cards
- `index/INDEX.json`
- `index/ALIASES.json`
- canon or alias mutation targets

## Gated conversion expectations

A gated conversion may require:

- later human review posture already present in the source artifact
- required source fields to exist
- proposal-only or nomination-only output posture
- bounded gate-state defaults in the resulting local artifact

## What conversion may not do

Conversion may not:

- execute routing
- perform forwarding
- claim approval
- write runtime state
- write registry truth
- mutate cards, index, or aliases
- add hidden engine behavior

## Reading note

A successful conversion result is still only a local Studio artifact.
It is not an execution order, approval grant, or truth mutation command.

## Closure statement

This conversion matrix exists to permit a narrow, auditable set of proposal-layer Studio transformations without opening runtime behavior, truth mutation, or hidden promotion semantics.
