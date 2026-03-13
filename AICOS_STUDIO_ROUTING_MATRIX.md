# AICOS Studio Routing Matrix

## Status

This document defines the repo-near routing and transition boundary for AICOS Studio outputs.
It is a reference-layer routing contract only.
It does not define runtime execution, MEC state machines, provider orchestration, or truth mutation.

## Purpose

The purpose of this routing matrix is to make the next-step boundary explicit.
It defines which Studio-originated artifacts may move into which later artifact classes, which transitions require gates, and which paths remain forbidden.

## Artifact classes

### Conversation artifact

A conversation artifact is the raw or lightly structured record of a Studio discussion.
It may include turns, challenge notes, partial synthesis, and participant observations.
It is not truth and it is not a runtime review object.

### Studio intake packet

A studio intake packet is the bounded packet defined by the intake packet spec.
It preserves proposal type, evidence posture, challenge posture, open conflicts, and next review target framing.
It remains proposal-only.

### Proposal artifact

A proposal artifact is a narrowed, review-oriented distillation derived from Studio work.
It may recommend a later review destination.
It is still not registry truth.

### Handoff artifact

A handoff artifact is a bounded relay artifact intended to carry a Studio result into a later human-owned review context.
It may point to the next review destination conceptually.
It must not act as a direct runtime write object.

### Reference artifact

A reference artifact is repo-near supporting material kept for later reading, interpretation, or comparison.
It may help humans understand why a proposal exists.
It is not a truth surface.

### Card candidate / review target

A card candidate or review target is a conceptual destination for later human truth-facing review.
It can be named as the next review target.
It is not itself a card mutation.

### Runtime review object

A runtime review object belongs to runtime or MEC-facing review systems.
Studio routing does not define or authorize direct creation of runtime review objects.

### Registry truth

Registry truth is the live canonical surface in:

- `cards/`
- `index/INDEX.json`
- `index/ALIASES.json`
- related registry truth workflows

Studio routing must not create a direct path into registry truth.

## Routing states

Each routing direction below is classified as one of the following:

- `allowed`
- `allowed with gate`
- `forbidden`

## Minimum gates

### User gate

A user gate is mandatory before a Studio-originated output is treated as a candidate for any later truth-facing or runtime-adjacent review.
The user gate may keep, archive, or forward the artifact.
It does not itself perform promotion.

### Evidence gate

A route that depends on review seriousness must check whether the packet has enough evidence posture for the proposed destination.
Conversation-only support is weaker than example-supported or cross-reference-supported support.

### Conflict visibility gate

A route is not valid if it hides unresolved conflict that materially affects the destination decision.
Open conflicts must remain visible.

### No-silent-promotion gate

No route may implicitly convert format change into promotion.
A cleaner artifact is still not canon truth.

### No-runtime-write gate

No Studio-originated route may directly create runtime review state through this routing matrix.
Runtime-facing movement, if ever defined later, would require a separate explicit surface outside this document.

### No-truth-mutation gate

No route in this document may directly mutate `cards/`, `index/INDEX.json`, or `index/ALIASES.json`.
Truth-facing action remains a later, explicit, human-owned step outside this matrix.

## Routing matrix

### Studio packet -> proposal artifact

- classification: `allowed`
- rationale: this is a same-layer distillation from packet form into a bounded proposal-layer artifact
- required posture:
  - preserve proposal-only state
  - preserve open conflicts
  - preserve non-truth status

### Studio packet -> handoff artifact

- classification: `allowed with gate`
- required gates:
  - user gate
  - conflict visibility gate
  - no-silent-promotion gate
- rationale: a handoff is permitted only when the packet is being prepared for later human-owned review rather than treated as a direct decision

### Studio packet -> reference draft

- classification: `allowed`
- rationale: repo-near reference drafting is acceptable when the output remains explanatory and non-truth-bearing
- required posture:
  - clearly mark as reference-only
  - do not present as canon truth

### Studio packet -> card review target

- classification: `allowed with gate`
- required gates:
  - user gate
  - evidence gate
  - conflict visibility gate
  - no-truth-mutation gate
- rationale: the packet may nominate a later card candidate or review target, but nomination is not mutation

### Studio packet -> runtime review object

- classification: `forbidden`
- rationale: this document does not define runtime review writes, MEC objects, or runtime state creation

### Proposal artifact -> registry truth

- classification: `forbidden`
- rationale: a proposal artifact may inform later human work but cannot become registry truth by routing alone

### Reference artifact -> registry truth

- classification: `forbidden`
- rationale: reference material is explanatory support, not a canon update path

### Handoff -> runtime review object

- classification: `forbidden`
- rationale: a handoff artifact may point toward later review, but this routing matrix does not authorize runtime writes or object creation

### Any Studio output -> direct index/alias mutation

- classification: `forbidden`
- rationale: no Studio-originated artifact may directly mutate `index/INDEX.json` or `index/ALIASES.json`

## Transition interpretation notes

### Allowed

`allowed` means the transition stays within the proposal/reference layer and does not require a new truth-facing or runtime-facing authority boundary.
Even when allowed, the output remains non-canonical.

### Allowed with gate

`allowed with gate` means the transition is acceptable only if the listed gates are satisfied explicitly.
If a gate is missing, the route must stop.

### Forbidden

`forbidden` means the route violates the proposal-only boundary, the runtime separation boundary, or the no-truth-mutation rule.
A forbidden route must not be reframed as merely a documentation shortcut.

## Stop conditions

The route must stop if any of the following is true:

- the user gate has not been satisfied where required
- unresolved conflicts are being hidden to make the artifact easier to forward
- evidence posture is too weak for the claimed next destination
- the route would create runtime review state
- the route would mutate registry truth directly
- the route would turn provider agreement into proof of canon truth

## Closure statement

This routing matrix exists to define controlled next-step movement for Studio outputs without creating a hidden engine, a hidden promotion path, or a second truth system.
