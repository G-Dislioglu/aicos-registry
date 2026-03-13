# AICOS Studio Gate Report Spec

## Status

This document defines a repo-near gate report artifact for AICOS Studio.
It is a local review-layer record only.
It does not define runtime execution, provider calls, or truth mutation.

## Purpose

The purpose of a gate report is to record the outcome of one bounded Studio gate check against one bounded Studio artifact.
It keeps gate outcome, decision codes, and approval requirements visible without turning a checklist into an execution engine.

## Artifact boundary

A gate report is:

- local JSON only
- review-layer only
- bounded to proposal-safe gate interpretation
- non-executive and non-mutating

A gate report is not:

- registry truth
- a runtime review object
- a forwarding command
- a card mutation instruction
- a hidden approval token

## Required fields

A gate report must include at least:

- `artifact_type`
- `gate_report_id`
- `subject_artifact_type`
- `subject_ref`
- `topic`
- `gate_name`
- `gate_outcome`
- `gate_summary`
- `decision_codes`
- `approval_requirement`
- `record_scope`

The `record_scope` value for this artifact class must be `review_layer_only`.

## Optional fields

A gate report may additionally include:

- `reviewed_at`
- `observed_issues`
- `review_notes`

Optional fields may clarify the report but must not add execution authority.

## Forbidden fields

The following are forbidden in a gate report:

- `runtime_review_object`
- `runtime_state`
- `truth_mutation_target`
- `card_write_target`
- `index_write_target`
- `alias_write_target`

It is also forbidden to encode runtime actions, registry write paths, or hidden approval semantics.

## Allowed gate names

A gate report may use only the bounded Studio gate names:

- `intake_completeness_gate`
- `evidence_gate`
- `conflict_visibility_gate`
- `proposal_only_gate`
- `no_truth_mutation_gate`
- `no_runtime_write_gate`
- `handoff_quality_gate`
- `card_review_target_gate`

## Allowed gate outcomes

A gate report may use only the bounded Studio gate outcomes:

- `pass`
- `soft_fail`
- `hard_stop`

A gate report must not encode execution-like outcomes such as runtime authorization or truth-mutation authorization.

## Allowed decision codes

A gate report may use only the bounded Studio decision codes:

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

## Proposal-only and boundary limits

A gate report must remain inside the review layer.
It may not:

- mutate registry truth
- create runtime review state
- silently forward artifacts
- claim that a gate pass equals approval, canonization, or execution

## Reading note

A gate report captures one gate outcome clearly.
It does not replace fuller review reasoning when the case is ambiguous or conflict-bearing.

## Closure statement

This gate report spec exists to make Studio gate outcomes legible without creating a second decision engine, runtime authority, or hidden truth path.
