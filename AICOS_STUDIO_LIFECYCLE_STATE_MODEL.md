# AICOS Studio Lifecycle State Model

## Status

This document defines the repo-near lifecycle state model for AICOS Studio artifacts.
It is a reference-layer state contract only.
It does not define runtime execution, MEC state, operator actions, or truth mutation.

## Purpose

The purpose of this lifecycle model is to make the temporal posture of Studio artifacts explicit.
It defines which states a Studio artifact may pass through, which states remain proposal-layer only, and which states must never be confused with runtime or canon truth.

## State model overview

A Studio artifact may move through bounded lifecycle states such as:

- `captured`
- `normalized`
- `challenged`
- `gated`
- `forwarded`
- `held`
- `split`
- `archived`
- `discarded`

These are proposal-layer handling states only.
None of them means registry truth or runtime review state.

## State definitions

### `captured`

Meaning:
The artifact has been recorded from Studio output in a readable initial form.

Allowed posture:
- raw or lightly structured
- may still contain ambiguity
- must remain non-truth and non-runtime

Typical next states:
- `normalized`
- `held`
- `discarded`

### `normalized`

Meaning:
The artifact has been shaped into a bounded template or readable review form.

Allowed posture:
- required fields are present
- artifact type is explicit
- proposal-only status remains explicit

Typical next states:
- `challenged`
- `gated`
- `held`
- `split`

### `challenged`

Meaning:
The artifact has undergone contradiction pressure, counterexample review, or disagreement exposure.

Allowed posture:
- conflict may remain unresolved
- challenge visibility must be preserved
- disagreement must not be reformatted into false closure

Typical next states:
- `gated`
- `held`
- `split`
- `discarded`

### `gated`

Meaning:
The artifact has been checked against the relevant proposal-layer gates.

Allowed posture:
- may pass some gates and fail others
- gate outcomes must remain explicit
- this state does not itself approve mutation or runtime action

Typical next states:
- `forwarded`
- `held`
- `split`
- `archived`
- `discarded`

### `forwarded`

Meaning:
The artifact has been explicitly forwarded to a bounded later human-facing review destination.

Allowed posture:
- forwarding remains conceptual and proposal-layer
- forwarding does not equal approval
- forwarding does not equal canonization

Typical next states:
- `archived`
- `held`

### `held`

Meaning:
The artifact is intentionally paused because the current review posture is not strong enough for forwarding.

Allowed posture:
- artifact remains legible and retained
- unresolved issues remain visible
- may wait for clarification, evidence, or user decision

Typical next states:
- `normalized`
- `challenged`
- `gated`
- `discarded`
- `archived`

### `split`

Meaning:
The artifact is divided into narrower proposal-layer artifacts because the current one mixes separable issues or incompatible review paths.

Allowed posture:
- split preserves traceability
- split must not erase conflict or evidence differences
- split does not promote any child artifact

Typical next states:
- `normalized`
- `challenged`
- `gated`

### `archived`

Meaning:
The artifact is retained as a bounded record or reference item with no active forwarding pressure.

Allowed posture:
- may remain useful for later reading
- remains non-truth and non-runtime
- archival is not silent promotion

Typical next states:
- none by default
- later human reopening would be a separate explicit action

### `discarded`

Meaning:
The artifact is not suitable for further forwarding in its current form.

Allowed posture:
- discard may result from insufficient evidence, excessive ambiguity, or unusable drift
- discard does not imply deletion from history if trace retention is needed

Typical next states:
- none by default

## Proposal-layer invariants

All lifecycle states in this document remain proposal-layer only.
This includes:

- `captured`
- `normalized`
- `challenged`
- `gated`
- `forwarded`
- `held`
- `split`
- `archived`
- `discarded`

No state in this lifecycle model implies:

- registry truth
- card mutation
- index mutation
- alias mutation
- runtime review object creation
- MEC review state

## Forbidden interpretations

The following interpretations are forbidden:

- `forwarded` means approved truth
- `gated` means canon-ready by default
- `normalized` means evidence-complete
- `archived` means accepted truth
- `split` means one branch may silently promote
- any lifecycle state means runtime execution authority

## State transition notes

### Allowed transition shape

A typical bounded path may look like:

- `captured` -> `normalized` -> `challenged` -> `gated` -> `forwarded`

A holding path may look like:

- `captured` -> `normalized` -> `held`

A narrowing path may look like:

- `normalized` -> `split` -> `normalized`

A stop path may look like:

- `challenged` -> `discarded`

### Gate-sensitive transitions

The following transitions are especially gate-sensitive:

- `challenged` -> `gated`
- `gated` -> `forwarded`
- `held` -> `gated`
- `split` -> `forwarded`

These require explicit review discipline and may require user, evidence, or conflict-visibility checks.

## Stop conditions

A lifecycle transition must stop if any of the following becomes true:

- the artifact is being interpreted as truth rather than proposal-layer material
- the artifact is being converted into runtime-facing state
- unresolved conflict is hidden to enable forwarding
- evidence posture is too weak for the intended next step
- forwarding is attempted without the required user gate

## Closure statement

This lifecycle model makes Studio artifact progression legible without turning lifecycle states into execution authority, runtime state, or canon truth.
