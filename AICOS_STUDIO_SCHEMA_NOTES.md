# AICOS Studio Schema Notes

## Status

This document explains the machine-readable schema layer for AICOS Studio artifacts.
It is a formalization note only.
It does not define runtime execution, provider orchestration, or truth mutation.

## What was formalized

The following surfaces are now formalized as JSON schemas under `schemas/studio/`:

- studio intake packet
- proposal artifact
- handoff artifact
- reference artifact
- card review target artifact

The schemas formalize:

- required fields
- bounded enum values for key proposal-layer fields
- proposal-only and nomination-only artifact typing
- absence of runtime-write and truth-mutation fields through closed object shapes
- bounded next review targets consistent with the current Studio line

The validation corpus under `examples/studio/` now includes:

- valid examples derived from the current example packet line
- valid examples for the artifact template family
- intentionally invalid counterexamples that should fail schema validation

## What was deliberately not formalized

The schema layer does not attempt to formalize:

- evidence quality judgment beyond bounded status enums
- contradiction seriousness beyond explicit list presence
- user approval semantics as executable authority
- full routing policy as an executable engine
- provider behavior rules as runtime orchestration
- runtime review objects or MEC state
- registry truth mutation workflows

## Schema limits

The schemas make shape and boundary mistakes easier to catch, but they do not prove:

- that a summary is wise
- that evidence is actually good enough in practice
- that conflict was interpreted correctly
- that a later review decision is substantively correct
- that a human gate was appropriately exercised

They are best understood as shape guards and boundary guards.
They are not truth validators and not review authority.

## What would belong to S2 or an engine layer

The following would belong to a later S2 or engine-oriented layer rather than this schema layer:

- executable routing logic
- persistent review state management
- runtime handoff objects
- operator workflow execution
- provider scheduling or debate orchestration
- automated gate progression
- mutation-capable registry workflows

## Closure statement

This schema layer exists to reduce free interpretation in future Studio implementation work while preserving the proposal-only boundary and the separation from runtime and canon truth.
