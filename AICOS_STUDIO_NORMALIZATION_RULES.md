# AICOS Studio Normalization Rules

## Status

This document defines bounded normalization rules for existing AICOS Studio artifacts.
It is a local preparation layer only.
It does not define runtime execution, forwarding, or truth mutation.

## Purpose

Normalization exists to bring Studio artifacts into a canonical JSON shape.
It improves local consistency, schema fit, and auditability without changing the artifact into a new authority surface.

## Supported normalization targets

Normalization may target only the existing bounded Studio artifact kinds:

- `studio_intake_packet`
- `proposal_artifact`
- `handoff_artifact`
- `reference_artifact`
- `card_review_target_artifact`
- `review_record`
- `gate_report`
- `studio_bundle_manifest`

## What normalization may do

Normalization may:

- parse local JSON
- set canonical `artifact_type` when the kind is explicit
- apply known proposal-layer defaults when those defaults are already bounded by existing schemas
- normalize array order and deduplicate repeated string entries where local shape permits it
- normalize `included_artifacts` order in bundle manifests
- apply canonical field order for readability and stable diffs
- preserve proposal-only and review-layer boundaries

## What normalization may not do

Normalization may not:

- invent new ontology
- add runtime-facing fields
- add truth-mutation targets
- add forwarding authority
- rewrite meaning beyond bounded defaults
- turn a descriptive artifact into approval or execution

## Field classes that may be normalized

The normalization layer may normalize:

- field ordering
- bounded default values already defined by the Studio layer
- string-array trimming, deduplication, and stable ordering where appropriate
- bundle member ordering by local ref
- required boundary flags that are already part of the artifact contract

## Forbidden input and output fields

Normalization inputs and outputs must not contain:

- `runtime_review_object`
- `runtime_state`
- `truth_mutation_target`
- `card_write_target`
- `index_write_target`
- `alias_write_target`

## Promotion and boundary discipline

Normalization must not carry an illegal promotion state.
Only bounded proposal-layer values such as `proposal_only` and `not_promoted` may survive normalization where the schema allows them.

## Reading note

Normalization is a local prep step only.
A normalized artifact is still just a Studio artifact.
It is not runtime-ready, approval-ready, or canon-ready by normalization alone.

## Closure statement

These normalization rules exist to make bounded Studio artifacts more canonical and machine-legible without introducing runtime authority, truth mutation, or hidden workflow semantics.
