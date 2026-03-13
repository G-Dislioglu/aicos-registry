# AICOS Studio Example Packets

## Status

This document provides concrete example packets for the existing AICOS Studio intake contract.
These are reference examples only.
They do not define runtime behavior or registry mutation.

## Purpose

The goal of these examples is to make the intake packet contract operational and repeatable.
They show how proposal-only studio outputs can stay legible without drifting into canon truth, runtime review state, or silent promotion.

## Example 1 — Idea-origin packet

### Packet type

Idea-origin packet for an early concept that emerged from bounded exploration.

### Packet

- `topic`: whether a later studio process should maintain a dedicated pattern for cross-domain contradiction logging before deeper review
- `participants`: `maya:moderator`, `maya:observer`, `provider:claude_sonnet`, `provider:gpt_reasoner`, `human:operator`
- `proposal_type`: `idea_probe`
- `claim_status`: `exploratory`
- `evidence_status`: `conversation_only`
- `challenge_status`: `challenge_in_progress`
- `drift_risk`: `medium`
- `promotion_state`: `proposal_only`
- `distilled_summary`: a bounded idea emerged that contradiction logging might deserve its own later review target, but current support is still mostly conceptual and should remain proposal-only
- `open_conflicts`: no clear threshold yet for when contradiction logging becomes a separate review object rather than staying a note inside another packet
- `next_review_target`: `manual_design_followup`

### Why this stays proposal-only

- the idea is promising but not evidence-backed enough for truth-facing use
- the packet preserves exploration without pretending the concept is already canon-ready
- user review would still be needed before any follow-up path is opened

## Example 2 — Card-review packet

### Packet type

Card-review packet for a later human review of a single existing registry card boundary.

### Packet

- `topic`: whether an existing registry card should receive a later manual clarity review because studio debate found ambiguous scope language
- `participants`: `maya:moderator`, `maya:distillator`, `provider:claude_sonnet`, `provider:gemini_flash`, `human:operator`
- `proposal_type`: `review_target_candidate`
- `claim_status`: `bounded_proposal`
- `evidence_status`: `cross_reference_supported`
- `challenge_status`: `challenge_passed_for_proposal_use`
- `drift_risk`: `low`
- `promotion_state`: `not_promoted`
- `distilled_summary`: the discussion does not propose a direct registry change but does justify a later human registry review focused on scope clarity and wording discipline for one already-existing card
- `open_conflicts`: participants disagree on whether the ambiguity is substantial enough to justify review priority now or should wait for a larger content pass
- `next_review_target`: `human_registry_review`

### Why this stays proposal-only

- the packet can nominate a review target without changing the card
- cross-reference support is present, but the packet still does not become truth on its own
- recommendation remains bounded to later human review

## Example 3 — Situation-analysis packet

### Packet type

Situation-analysis packet for a live design question where the studio tries to summarize the current state before any deeper intervention.

### Packet

- `topic`: how to summarize the current boundary between studio proposal artifacts and existing registry truth so future work does not blend the two
- `participants`: `maya:observer`, `maya:distillator`, `provider:claude_sonnet`, `provider:gpt_reasoner`, `provider:deepseek_chat`
- `proposal_type`: `design_direction`
- `claim_status`: `bounded_proposal`
- `evidence_status`: `example_supported`
- `challenge_status`: `challenged_with_open_conflicts`
- `drift_risk`: `medium`
- `promotion_state`: `proposal_only`
- `distilled_summary`: the current direction should keep studio artifacts repo-near, proposal-only, and explicitly outside registry truth and runtime review, but the precise future review handoff format still needs discipline
- `open_conflicts`: some participants want a richer packet with more audit metadata while others want to keep the packet intentionally thin to avoid pseudo-runtime drift
- `next_review_target`: `manual_design_followup`

### Why this stays proposal-only

- this is still a framing and boundary analysis rather than a truth claim
- disagreement about packet richness remains unresolved
- the packet records the situation without turning design preference into canon

## Example 4 — Contradiction/challenge packet

### Packet type

Contradiction or challenge packet built to preserve strong disagreement rather than erase it through synthesis.

### Packet

- `topic`: whether multi-provider agreement should ever count as enough support for studio output to bypass a later human gate
- `participants`: `maya:moderator`, `challenge_participant:red_team`, `external_expert:systems_reviewer`, `provider:claude_sonnet`, `provider:gpt_reasoner`, `human:operator`
- `proposal_type`: `challenge_dossier_seed`
- `claim_status`: `conflicted`
- `evidence_status`: `needs_evidence`
- `challenge_status`: `challenged_with_open_conflicts`
- `drift_risk`: `high`
- `promotion_state`: `proposal_only`
- `distilled_summary`: the challenge round surfaced a strong boundary risk: provider agreement may improve confidence for later human review, but it must not substitute for the required user gate or become a hidden truth shortcut
- `open_conflicts`: disagreement remains over how much provider convergence should matter for review priority, and there is no accepted standard for treating convergence as anything more than advisory evidence
- `next_review_target`: `request_human_decision`

### Why this stays proposal-only

- the packet exists precisely because the contradiction is unresolved
- high drift risk means it should not be normalized into operational truth
- the preserved conflict is more valuable here than premature closure

## Reading note

These examples are intended to be copied as reference structure, not as canonical templates that force every future packet into the same wording.
The stable requirement is field coverage and boundary discipline, not stylistic uniformity.
