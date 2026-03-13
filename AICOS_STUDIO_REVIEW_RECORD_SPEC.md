# AICOS Studio Review Record Spec

## Status

This document defines a repo-near review record artifact for AICOS Studio.
It is a local review-layer record only.
It does not define runtime execution, provider calls, or truth mutation.

## Purpose

The purpose of a review record is to capture a structured review decision about a bounded Studio artifact.
It keeps decision type, decision codes, lifecycle posture, and resulting next posture legible without turning review into execution.

## Artifact boundary

A review record is:

- local JSON only
- review-layer only
- proposal-safe and non-executive
- allowed to describe later human review posture

A review record is not:

- registry truth
- a runtime review object
- a card mutation instruction
- an index or alias mutation instruction
- an automatic forwarding trigger

## Required fields

A review record must include at least:

- `artifact_type`
- `review_record_id`
- `subject_artifact_type`
- `subject_ref`
- `topic`
- `lifecycle_state`
- `decision_type`
- `decision_codes`
- `review_summary`
- `user_gate_status`
- `resulting_next_posture`
- `record_scope`

The `record_scope` value for this artifact class must be `review_layer_only`.

## Optional fields

A review record may additionally include:

- `reviewed_at`
- `gate_report_refs`
- `open_conflicts`
- `notes`

Optional fields may clarify the review but must not add execution authority.

## Forbidden fields

The following are forbidden in a review record:

- `runtime_review_object`
- `runtime_state`
- `truth_mutation_target`
- `card_write_target`
- `index_write_target`
- `alias_write_target`

It is also forbidden to encode provider instructions, runtime write paths, or hidden canon promotion language.

## Allowed decision types

A review record may use only the bounded Studio decision types:

- `forward`
- `hold`
- `split`
- `downgrade`
- `archive`
- `discard`

## Allowed decision codes

A review record may use only the bounded Studio decision codes:

- `insufficient_evidence`
- `unresolved_conflict`
- `proposal_only_keep`
- `handoff_ready`
- `reference_draft_only`
- `registry_review_nomination_only`
- `runtime_forbidden`
- `truth_mutation_forbidden`
- `user_gate_required`
- `archive_preferred`
- `split_required`

These codes remain explanatory labels only.
They do not create execution authority.

## Required posture fields

A review record must keep the following posture explicit:

- current `lifecycle_state`
- chosen `decision_type`
- resulting `resulting_next_posture`
- whether user gate is still required via `user_gate_status`

## Proposal-only and boundary limits

A review record must remain inside the review layer.
It may not:

- mutate registry truth
- create runtime review state
- claim automatic promotion
- imply that user approval overrides truth-mutation or runtime-write violations

A review record may point to bounded later review postures such as `manual_design_followup`, `request_human_decision`, or `human_registry_review`, but only as a recorded review outcome.

## Reading note

A review record shortens later reading and auditability.
It does not replace the need for human-readable reasoning.

## Closure statement

This review record spec exists to structure Studio review decisions without creating a second truth system, runtime authority, or hidden forwarding engine.
