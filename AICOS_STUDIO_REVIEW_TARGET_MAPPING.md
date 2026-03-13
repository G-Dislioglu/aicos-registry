# AICOS Studio Review Target Mapping

## Status

This document defines repo-near mapping guidance from `proposal_type` to bounded `next_review_target` outcomes.
It is guidance for review targeting only.
It does not define execution, runtime writes, or truth mutation.

## Purpose

The purpose of this mapping is to reduce ambiguity around where a Studio packet may point next.
It clarifies which transitions are normal inside the proposal layer, which require explicit gates, and which remain forbidden.

## Mapping language

Each mapping below uses these classes:

- `normal`
- `gated`
- `forbidden`

### `normal`

A normal mapping stays safely inside the proposal/reference layer and does not imply promotion.

### `gated`

A gated mapping is only acceptable if the listed gates are satisfied.

### `forbidden`

A forbidden mapping would cross into runtime review or registry truth in a way this Studio line does not allow.

## Required gates

### User gate

The user must explicitly allow a packet to be carried forward when the mapping points to a later review destination.

### Evidence gate

The evidence posture must fit the seriousness of the proposed next target.
A conversation-only packet should not be treated like a supported review packet.

### Conflict visibility gate

Open conflicts must remain visible if they materially affect the destination choice.

### No-silent-promotion gate

A mapping must not imply that a clearer packet is now closer to truth just because it is cleaner.

### No-runtime-write gate

A mapping must not create or imply runtime review writes.

### No-truth-mutation gate

A mapping must not directly mutate registry truth or imply that review targeting itself is canonization.

## Proposal type to next review target mapping

### `idea_probe`

Typical meaning:
A bounded exploratory idea that is still early and may need more framing before any serious review target is justified.

Typical `next_review_target` mappings:

- `manual_design_followup`: `normal`
- `request_human_decision`: `gated`
- `none`: `normal`
- `human_registry_review`: `forbidden`
- `future_mec_context_review`: `forbidden`

Gate notes:

- `request_human_decision` requires:
  - user gate
  - conflict visibility gate
  - no-silent-promotion gate

### `card_review`

Typical meaning:
A packet focused on whether an existing card boundary, wording, or review priority deserves later human attention.

Typical `next_review_target` mappings:

- `human_registry_review`: `gated`
- `manual_design_followup`: `normal`
- `none`: `normal`
- `future_mec_context_review`: `forbidden`

Gate notes:

- `human_registry_review` requires:
  - user gate
  - evidence gate
  - conflict visibility gate
  - no-truth-mutation gate

## `review_target_candidate`

Typical meaning:
A packet that already behaves like a bounded nomination for a later review target without performing mutation.

Typical `next_review_target` mappings:

- `human_registry_review`: `gated`
- `manual_design_followup`: `normal`
- `request_human_decision`: `gated`
- `future_mec_context_review`: `forbidden`

Gate notes:

- `human_registry_review` requires:
  - user gate
  - evidence gate
  - no-truth-mutation gate
- `request_human_decision` requires:
  - user gate
  - conflict visibility gate

### `situation_analysis`

Typical meaning:
A packet that summarizes the current state, boundary, or design posture before any harder review decision is taken.

Typical `next_review_target` mappings:

- `manual_design_followup`: `normal`
- `request_human_decision`: `gated`
- `none`: `normal`
- `human_registry_review`: `forbidden`
- `future_mec_context_review`: `forbidden`

Gate notes:

- `request_human_decision` requires:
  - user gate
  - conflict visibility gate
  - no-silent-promotion gate

### `design_direction`

Typical meaning:
A packet that narrows a possible design direction while still preserving uncertainty and proposal-only posture.

Typical `next_review_target` mappings:

- `manual_design_followup`: `normal`
- `request_human_decision`: `gated`
- `none`: `normal`
- `human_registry_review`: `forbidden`
- `future_mec_context_review`: `forbidden`

Gate notes:

- `request_human_decision` requires:
  - user gate
  - conflict visibility gate
  - no-silent-promotion gate

### `contradiction_packet`

Typical meaning:
A packet that preserves contradiction, challenge pressure, or counterexample posture as the primary result.

Typical `next_review_target` mappings:

- `request_human_decision`: `gated`
- `manual_design_followup`: `normal`
- `none`: `normal`
- `human_registry_review`: `forbidden`
- `future_mec_context_review`: `forbidden`

Gate notes:

- `request_human_decision` requires:
  - user gate
  - conflict visibility gate
  - evidence gate

### `challenge_dossier_seed`

Typical meaning:
A packet that seeds later challenge-oriented reading while preserving unresolved conflict and non-truth status.

Typical `next_review_target` mappings:

- `request_human_decision`: `gated`
- `manual_design_followup`: `normal`
- `none`: `normal`
- `human_registry_review`: `forbidden`
- `future_mec_context_review`: `forbidden`

Gate notes:

- `request_human_decision` requires:
  - user gate
  - conflict visibility gate
  - no-runtime-write gate

## Destination interpretation notes

### `none`

Use `none` when the packet should remain archived, read, or compared later without any immediate forwarding pressure.

### `manual_design_followup`

Use `manual_design_followup` when the next step should remain proposal-layer and human-discursive rather than truth-facing.

### `request_human_decision`

Use `request_human_decision` when a human should explicitly decide whether the packet deserves any stronger follow-up.
This is not a truth mutation path.

### `human_registry_review`

Use `human_registry_review` only as a bounded nomination for later human truth-facing review.
It does not itself mutate the registry.

### `future_mec_context_review`

This target remains forbidden in this Studio mapping layer.
The current Studio line does not authorize runtime or MEC-facing handoff routing.

## Prohibited shortcuts

The following shortcuts remain forbidden:

- `proposal_type` -> direct card write
- `proposal_type` -> direct `index/INDEX.json` mutation
- `proposal_type` -> direct `index/ALIASES.json` mutation
- `proposal_type` -> direct runtime review object creation
- `proposal_type` -> provider-consensus-as-truth

## Closure statement

This mapping keeps `proposal_type` and `next_review_target` legible without turning review targeting into execution authority, runtime state, or canon truth.
