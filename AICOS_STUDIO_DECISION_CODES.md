# AICOS Studio Decision Codes

## Status

This document defines short reusable decision and outcome codes for Studio review.
These codes are reference-layer labels only.
They do not define runtime behavior, execution authority, or truth mutation.

## Purpose

The purpose of these codes is to keep review outcomes compact, repeatable, and interpretable across Studio artifacts.
They are intended to support consistent reading and decision recording.

## Code format

Each code below includes:

- code
- meaning
- typical use
- forbidden interpretation

## Decision and outcome codes

### `insufficient_evidence`

- meaning: the artifact does not have enough evidence posture for the intended forwarding strength
- typical use: use when hold, downgrade, or discard is justified because support remains too thin
- forbidden interpretation: this does not mean the idea is false, only that it is not ready for the proposed step

### `unresolved_conflict`

- meaning: material disagreement remains open and must stay visible
- typical use: use when hold, split, downgrade, or gated forwarding depends on preserved contradiction
- forbidden interpretation: this does not mean automatic rejection

### `proposal_only_keep`

- meaning: the artifact should remain inside the proposal layer and not be escalated
- typical use: use when the artifact is still useful but should not move toward stronger destinations
- forbidden interpretation: this does not mean canon acceptance

### `handoff_ready`

- meaning: the artifact is bounded enough for handoff under the required gates
- typical use: use when forwarding into a later human-owned review posture is justified
- forbidden interpretation: this does not mean approval, execution, or mutation authority

### `reference_draft_only`

- meaning: the artifact may be kept as reference material but not used as a stronger forwarding object
- typical use: use when explanatory value exists without enough review strength for nomination or handoff
- forbidden interpretation: this does not mean hidden approval by documentation

### `registry_review_nomination_only`

- meaning: the artifact may nominate a later human registry review target but may not mutate truth directly
- typical use: use when `human_registry_review` is the bounded next posture under the required gates
- forbidden interpretation: this does not mean card acceptance or index mutation

### `runtime_forbidden`

- meaning: the contemplated path would improperly cross into runtime review or execution space
- typical use: use when a proposed artifact, destination, or wording implies runtime object creation or MEC-facing write behavior
- forbidden interpretation: this does not mean the artifact has no value, only that runtime routing is not allowed here

### `truth_mutation_forbidden`

- meaning: the contemplated path would improperly cross into canon truth mutation
- typical use: use when wording, routing, or decision framing implies direct card, index, or alias mutation
- forbidden interpretation: this does not mean the underlying idea can never be reviewed later

## Optional supporting codes

### `user_gate_required`

- meaning: bounded forwarding requires explicit user authorization before continuing
- typical use: pair with `handoff_ready` or `registry_review_nomination_only` when forwarding is allowed only with gate
- forbidden interpretation: this does not mean user approval overrides forbidden runtime or truth mutation paths

### `archive_preferred`

- meaning: the artifact should be kept as a stable record rather than actively forwarded
- typical use: use when the artifact is useful as reference or audit history but not a strong next-step object
- forbidden interpretation: this does not mean archived material has become accepted truth

### `split_required`

- meaning: the artifact should be divided into narrower artifacts before further review
- typical use: use when multiple incompatible destinations, conflict postures, or evidence postures are mixed together
- forbidden interpretation: this does not mean any split child artifact is automatically stronger

## Reading note

These codes should shorten decision recording, not replace explanation.
A code should remain paired with short human-readable reasoning when used in later review notes.

## Closure statement

These decision codes keep review outcomes compact without creating an executable state machine, a second truth system, or hidden runtime authority.
