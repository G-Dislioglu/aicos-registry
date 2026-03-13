# AICOS Studio Review Procedure

## Status

This document defines a repo-near review procedure for Studio artifacts.
It is a procedure for bounded proposal-layer review only.
It does not define runtime execution, provider orchestration, or truth mutation.

## Purpose

The purpose of this procedure is to make Studio artifact review ordered, repeatable, and legible.
It defines review sequence, required review questions, decision types, and the points at which gates become mandatory.

## Review sequence

A bounded Studio artifact review should follow this order:

1. identify the artifact type
2. confirm basic completeness
3. confirm proposal-only status
4. inspect evidence posture
5. inspect conflict visibility
6. decide whether the artifact should be forwarded, held, split, downgraded, archived, or discarded
7. require user gate where forwarding or stronger nomination is being considered

## Minimum review questions

### Artifact identity questions

- what artifact type is this
- what topic does it actually cover
- what is the bounded scope
- what is the proposed next destination, if any

### Boundary questions

- does the artifact remain proposal-only, reference-only, or nomination-only
- does any wording imply truth mutation
- does any wording imply runtime execution or review state creation

### Evidence questions

- what is the explicit evidence posture
- does the evidence match the seriousness of the proposed next step
- is any weak evidence being overstated

### Conflict questions

- what remains unresolved
- is disagreement visible enough for a later reader
- has contradiction been cleaned away for presentation reasons

### Destination questions

- is the proposed next destination allowed at all
- if allowed, is it normal or gate-dependent
- if gate-dependent, which gates must pass before forwarding

## Decision types

### `forward`

Use when the artifact is bounded, legible, proposal-only, and ready for a later human-facing destination under the required gates.

### `hold`

Use when the artifact should be retained but not forwarded yet because more clarity, challenge, or evidence is needed.

### `split`

Use when the artifact mixes multiple issues, destinations, or conflict postures that should not be forwarded together.

### `downgrade`

Use when the artifact must remain in a weaker destination class than originally proposed.
For example, a proposed handoff may need to remain reference-only or proposal-only.

### `archive`

Use when the artifact should be kept as a bounded record with no active forwarding pressure.

### `discard`

Use when the artifact is too weak, too confused, too misleading, or too drift-prone for further use in its current form.

## When user gate is mandatory

User gate is mandatory when:

- a Studio artifact is being forwarded toward `request_human_decision`
- a Studio artifact is being forwarded toward `human_registry_review`
- a handoff artifact is being carried beyond archive or reference-only retention
- a conflict-bearing artifact is being forwarded rather than held

User gate is not a promotion action.
It only authorizes bounded forwarding into a later human-owned review posture.

## When conflict visibility gate is mandatory

Conflict visibility gate is mandatory when:

- challenge has occurred and disagreement remains open
- contradiction materially affects the proposed destination
- the artifact is being forwarded despite unresolved tension
- a split decision is being considered to preserve separate conflicts cleanly

## When evidence gate is mandatory

Evidence gate is mandatory when:

- the artifact is being nominated for `human_registry_review`
- the artifact claims stronger forwarding seriousness than conversation-only material normally supports
- contradiction or challenge claims are being used to justify a stronger destination

## When nothing may be forwarded

Nothing may be forwarded when:

- proposal-only status is unclear
- truth mutation language appears
- runtime write language appears
- unresolved conflict is hidden
- evidence posture is materially overstated
- required user gate is missing
- the proposed destination is forbidden by the routing layer

## Procedure by phase

### Phase 1 — Intake and identification

Goal:
Determine what artifact is under review and whether it is structurally legible enough for further consideration.

Possible outcomes:

- `hold`
- `discard`
- continue to Phase 2

### Phase 2 — Boundary and gate review

Goal:
Check proposal-only posture, evidence posture, contradiction visibility, and forbidden content.

Possible outcomes:

- `hold`
- `downgrade`
- `split`
- `discard`
- continue to Phase 3

### Phase 3 — Destination decision

Goal:
Choose the bounded next posture consistent with routing and mapping constraints.

Possible outcomes:

- `forward`
- `hold`
- `split`
- `archive`
- `discard`

## Decision recording note

Every review should record at least:

- artifact type
- current lifecycle state
- decision type
- key gate reason
- whether user approval was required
- resulting next posture

This remains review-facing documentation only.
It is not runtime state.

## Closure statement

This review procedure exists to discipline Studio review decisions without turning review order into execution logic, runtime authority, or truth mutation.
