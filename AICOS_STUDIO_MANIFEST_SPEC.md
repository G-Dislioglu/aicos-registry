# AICOS Studio Manifest Spec

## Status

This document defines a repo-near bundle manifest artifact for AICOS Studio.
It is a local packaging manifest only.
It does not define runtime execution, provider calls, forwarding, or truth mutation.

## Purpose

The purpose of a bundle manifest is to record the minimal machine-readable description of one bounded Studio bundle.
It keeps package identity, package members, local boundary flags, and consistency posture explicit without turning a manifest into an execution plan.

## Artifact boundary

A bundle manifest is:

- local JSON only
- proposal-only
- a packaging-layer record
- allowed to summarize local review-layer completeness
- non-executive and non-mutating

A bundle manifest is not:

- registry truth
- a runtime review object
- a forwarding command
- a card mutation instruction
- an index or alias mutation instruction
- a hidden approval artifact

## Required fields

A bundle manifest must include at least:

- `artifact_type`
- `bundle_id`
- `bundle_type`
- `included_artifacts`
- `source_packet_ref`
- `review_refs`
- `gate_report_refs`
- `consistency_status`
- `intended_next_step`
- `proposal_only`
- `no_truth_mutation`
- `no_runtime_write`

The `artifact_type` value for this artifact class must be `studio_bundle_manifest`.
The boundary flags `proposal_only`, `no_truth_mutation`, and `no_runtime_write` must all remain explicitly true.

## Optional fields

A bundle manifest may additionally include:

- `topic`
- `bundle_summary`
- `notes`

Optional fields may clarify the package but must not add execution authority.

## Forbidden fields

The following are forbidden in a bundle manifest:

- `runtime_review_object`
- `runtime_state`
- `truth_mutation_target`
- `card_write_target`
- `index_write_target`
- `alias_write_target`

It is also forbidden to encode provider instructions, runtime write paths, canon mutation plans, or auto-forward semantics.

## Allowed bundle types

A bundle manifest may use only the bounded Studio bundle types:

- `review_package`
- `handoff_package`
- `reference_package`
- `mixed_review_package`

## Allowed bundle members

Each entry in `included_artifacts` may use only the bounded Studio artifact types:

- `studio_intake_packet`
- `proposal_artifact`
- `handoff_artifact`
- `reference_artifact`
- `card_review_target_artifact`
- `review_record`
- `gate_report`

Bundle membership remains descriptive only.
It does not imply routing or approval.

## Required manifest posture

A bundle manifest must keep the following package posture explicit:

- package identity via `bundle_id`
- package class via `bundle_type`
- explicit package membership via `included_artifacts`
- source packet trace via `source_packet_ref`
- review trace via `review_refs`
- gate trace via `gate_report_refs`
- local consistency posture via `consistency_status`
- descriptive later posture via `intended_next_step`
- explicit boundary flags via `proposal_only`, `no_truth_mutation`, and `no_runtime_write`

## Consistency rules

A bundle manifest should be locally consistent.
At minimum this means:

- `source_packet_ref` points to an included `studio_intake_packet`
- every entry in `review_refs` points to an included `review_record`
- every entry in `gate_report_refs` points to an included `gate_report`
- bundle membership does not include forbidden runtime or truth-facing artifact kinds

A manifest may report `needs_review`, `incomplete`, or `conflict_present` when package consistency is not fully settled.
That status remains descriptive only.

## Allowed intended next steps

A bundle manifest may use only the bounded descriptive next-step values:

- `retain_in_review_layer`
- `manual_design_followup`
- `request_human_decision`
- `human_registry_review`
- `archive_only`

These values are descriptive postures only.
They do not authorize forwarding.

## Proposal-only and boundary limits

A bundle manifest must remain inside the local Studio packaging layer.
It may not:

- mutate registry truth
- create runtime review state
- silently forward artifacts
- turn packaging completeness into approval
- act as a substitute for explicit human review

## Reading note

A bundle manifest improves local auditability by keeping package structure explicit.
It does not replace the need to inspect the actual bundled artifacts.

## Closure statement

This manifest spec exists to make Studio artifact packages machine-readable and locally checkable without creating runtime authority, truth mutation, or hidden bundle-to-execution behavior.
