# AICOS Error Ledger Spec

## Purpose

The error ledger records cognitive and process failures in framing, decomposition, evaluation, or synthesis.
It is not a bug tracker and not a moral blame log.
Its purpose is to preserve why a wrong path looked plausible at the time.

## Boundary

An error ledger entry is:

- local
- proposal-safe
- evaluation-only
- non-authoritative

It is not:

- an approval record
- a truth correction command
- a runtime remediation instruction

## Required fields

A valid ledger entry must contain:

- `artifact_type`
- `entry_id`
- `subject_ref`
- `phase`
- `error_class`
- `symptom`
- `why_plausible`
- `detected_by`
- `impact_band`
- `recovery_action`
- `status`

## Phase meanings

Allowed phases are:

- `framing`
- `decomposition`
- `evaluation`
- `synthesis`

## Error class meanings

Allowed error classes are:

- `misframing`
- `premature_closure`
- `false_assumption`
- `missed_signal`
- `invalid_constraint_inference`
- `pseudo_certainty`

## Why plausible

`why_plausible` is mandatory because the ledger should explain how a smart but bounded process could reasonably drift into the error.
Without this field the system learns only taboo language, not process correction.

## Detectors

Allowed detector values are:

- `preflight`
- `perspective_pass`
- `comparison`
- `human_review`

## Forbidden content

The following are forbidden:

- authority claims
- approval grants
- runtime application instructions
- registry mutation instructions
- “error score” rollups that imply authority

## Closure

The error ledger exists to preserve framing and reasoning failure modes as bounded local learning material without turning them into a hidden control plane or pseudo-truth surface.
