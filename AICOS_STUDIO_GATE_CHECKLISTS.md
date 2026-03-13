# AICOS Studio Gate Checklists

## Status

This document defines repo-near checklists for evaluating whether Studio artifacts are ready for bounded forwarding.
These checklists govern proposal-layer quality only.
They do not define runtime execution, truth mutation, or automated decision authority.

## Purpose

The purpose of these checklists is to make gate review legible and repeatable.
Each checklist identifies what must pass, what may soft-fail without immediate termination, and what requires a hard stop.

## Checklist 1 — Intake completeness gate

### Pass criteria

- artifact type is explicitly named
- required fields for the chosen artifact template are present
- topic and participants are legible
- evidence, challenge, and conflict posture are stated
- proposal-only status is explicit

### Soft-fail criteria

- optional metadata is missing
- some notes are thin but the artifact remains interpretable
- secondary context is incomplete but not misleading

### Hard-stop criteria

- required fields are missing
- artifact type is ambiguous
- next destination is claimed without enough structural context
- truth status is unclear

### Required user approval if applicable

Not required for basic completeness review alone.
User approval becomes required if the artifact is being forwarded beyond archive or reference use.

## Checklist 2 — Evidence gate

### Pass criteria

- evidence posture is explicitly named
- cited support fits the claimed next destination
- unsupported claims are marked as unsupported
- evidence limits are visible

### Soft-fail criteria

- supporting examples are thin but honestly marked
- cross-reference support is partial but not overstated
- evidence density is modest while destination remains low-authority

### Hard-stop criteria

- evidence is presented as stronger than it is
- conversation-only material is framed as review-ready proof
- missing evidence is hidden
- provider agreement is used as proof of truth

### Required user approval if applicable

User approval is required when evidence is being treated as sufficient for a later human review nomination.

## Checklist 3 — Contradiction visibility gate

### Pass criteria

- open conflicts are explicitly listed
- material disagreement remains visible
- contradiction is not removed for polish
- uncertainty survives the summary

### Soft-fail criteria

- minor tension is summarized at a high level
- some disagreement detail is condensed while the actual conflict remains legible

### Hard-stop criteria

- unresolved conflict is erased
- contradictory evidence is omitted
- formatting creates false closure
- artifact implies consensus that did not exist

### Required user approval if applicable

User approval is required before forwarding a conflict-bearing artifact toward a stronger review target.

## Checklist 4 — Proposal-only gate

### Pass criteria

- artifact explicitly remains proposal-only, reference-only, or nomination-only as appropriate
- no canon language is used
- no approval language is implied by formatting
- recommendation scope is bounded

### Soft-fail criteria

- wording is slightly too confident but still recoverable through clarification
- recommendation phrasing is broad while still non-mutating

### Hard-stop criteria

- artifact claims to be truth
- artifact claims automatic promotion
- artifact treats handoff or review nomination as approval
- artifact masks proposal status entirely

### Required user approval if applicable

User approval is required when the artifact is being forwarded beyond internal reference retention.

## Checklist 5 — No-truth-mutation gate

### Pass criteria

- no direct write instructions target `cards/`
- no direct write instructions target `index/INDEX.json`
- no direct write instructions target `index/ALIASES.json`
- review nomination is clearly separated from mutation

### Soft-fail criteria

- wording hints at future truth-facing work but remains clearly non-executing
- artifact needs small wording cleanup to avoid ambiguity

### Hard-stop criteria

- artifact contains direct truth mutation instructions
- artifact equates nomination with mutation
- artifact creates a hidden path to canon truth

### Required user approval if applicable

User approval alone is not sufficient to bypass this gate.
A failing artifact must be rewritten, not merely approved.

## Checklist 6 — No-runtime-write gate

### Pass criteria

- no runtime object creation is implied
- no MEC review state is defined
- no operator action is encoded as an artifact effect
- next destination remains conceptual rather than executable

### Soft-fail criteria

- wording suggests runtime adjacency but does not specify a write
- destination language needs narrowing to stay conceptual

### Hard-stop criteria

- artifact creates or implies runtime review objects
- artifact defines runtime write behavior
- artifact mixes proposal routing with execution semantics

### Required user approval if applicable

User approval does not override a runtime-write violation.
The artifact must remain non-executing.

## Checklist 7 — Handoff quality gate

### Pass criteria

- handoff scope is explicit
- handoff reason is explicit
- required gate state is visible
- unresolved conflict and evidence posture are preserved
- intended reader can understand what is being handed forward and what is not

### Soft-fail criteria

- handoff notes are brief but still usable
- some provenance detail is thin while the boundary remains clear

### Hard-stop criteria

- handoff reads like approval instead of relay
- handoff hides missing evidence or unresolved conflict
- handoff implies direct runtime or truth action
- handoff target is ambiguous

### Required user approval if applicable

User approval is required for handoff artifacts that move beyond archive or reference-only retention.

## Checklist 8 — Card-review-target gate

### Pass criteria

- review target scope is explicit
- review reason is explicit
- evidence posture fits later human review nomination
- no mutation language appears
- nomination remains bounded and traceable

### Soft-fail criteria

- review reason is somewhat broad but still understandable
- target scope could be narrowed further without blocking review

### Hard-stop criteria

- artifact attempts to mutate a card directly
- artifact mutates index or alias state directly
- runtime review logic is embedded
- review target is named as already accepted truth

### Required user approval if applicable

User approval is required before forwarding a card review target artifact toward `human_registry_review` or `request_human_decision`.

## Closing note

These checklists exist to discipline forwarding decisions, not to create a second decision engine.
They preserve human ownership, proposal-only posture, and the separation from runtime and truth mutation.
