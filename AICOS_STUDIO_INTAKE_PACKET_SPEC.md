# AICOS Studio Intake Packet Spec

## Status

This document defines the minimal intake packet for AICOS Studio / Maya Council outputs.
It is a packet contract only.
It does not define execution, runtime review, or truth mutation.

## Purpose

The intake packet exists to preserve enough structure that a studio output can be read later as:

- a conversation artifact
- a proposal artifact
- a bounded future review target

without confusing it with registry truth or a runtime review object.

## Artifact separation

The separation is explicit:

### Conversation artifact

A conversation artifact is a record of what happened in a studio discussion.
It may contain turns, participant summaries, disagreement, and raw synthesis.
It is not itself a proposal-ready truth object.

### Proposal artifact

A proposal artifact is a bounded distillation of the conversation.
It may recommend a next review target.
It remains proposal-only.

### Registry truth

Registry truth is the live canonical surface in:

- `cards/`
- `index/INDEX.json`
- related registry truth workflows

A studio intake packet is not registry truth.

### Runtime review object

A runtime review object belongs to runtime or MEC-facing review systems.
A studio intake packet is not a runtime review object.
It must not silently masquerade as one.

## Minimal packet shape

Each studio intake packet should include the following fields.

### `source_mode`

Describes the source pattern of the studio output.
Examples:

- `single_model_session`
- `multi_provider_debate`
- `maya_council`
- `expert_challenge_round`

### `participants`

List of actors that participated in the studio process.
May include:

- model/provider names
- human participants
- Maya role markers

### `topic`

Short statement of the question or issue under discussion.

### `proposal_type`

Bounded type of proposal the packet represents.
Examples:

- `idea_probe`
- `design_direction`
- `review_target_candidate`
- `registry_candidate_hint`
- `challenge_dossier_seed`

### `claim_status`

Current maturity of the main claim as discussed.
Examples:

- `exploratory`
- `bounded_proposal`
- `conflicted`
- `insufficiently_formed`

### `evidence_status`

Current evidence posture of the packet.
Examples:

- `conversation_only`
- `cross_reference_supported`
- `example_supported`
- `needs_evidence`

### `challenge_status`

Current challenge posture.
Examples:

- `unchallenged`
- `challenge_in_progress`
- `challenged_with_open_conflicts`
- `challenge_passed_for_proposal_use`

### `drift_risk`

Compact statement of scope-expansion or ontology-drift risk.
Examples:

- `low`
- `medium`
- `high`

### `recommendation_scope`

Bounded statement of what the packet recommends next.
Examples:

- `archive_only`
- `proposal_only`
- `review_later`
- `request_human_decision`

### `promotion_state`

Mandatory boundary field.
Expected S1/S0-style intake values:

- `proposal_only`
- `not_promoted`

This field must not imply canon truth.

### `distilled_summary`

A compact summary of the best current distillation.
It should preserve uncertainty and avoid false closure.

### `open_conflicts`

List of unresolved disagreements, missing evidence, or boundary tensions that still matter.

### `next_review_target`

If any later review is recommended, this field points only to the next review destination conceptually.
Examples:

- `none`
- `human_registry_review`
- `manual_design_followup`
- `future_mec_context_review`

This field is not an execution command.

## Optional supporting fields

Optional fields may include:

- `packet_id`
- `created_at`
- `source_refs`
- `moderator_notes`
- `distillator_notes`
- `challenge_notes`
- `user_gate_decision`

These remain supporting metadata only.

## Boundary rules

The packet must preserve all of the following:

- proposal-only state
- explicit non-truth status
- separation from runtime review objects
- separation from registry truth
- user-gated next-step framing

The packet must not:

- claim automatic promotion
- write direct truth mutation instructions
- erase unresolved conflicts by formatting alone
- use provider agreement as proof

## Recommended reading posture

When reading a studio intake packet:

- first ask what kind of artifact it is
- then ask whether the claim is still proposal-only
- then ask what remains unresolved
- only then decide whether a later human review target is justified

## Closure statement

This packet spec keeps studio outputs legible without turning them into canon truth, runtime review state, or a second hidden decision system.
