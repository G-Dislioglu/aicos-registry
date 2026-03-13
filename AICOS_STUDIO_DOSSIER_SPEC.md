# AICOS Studio Dossier Spec

## Status

This document defines a repo-near Studio dossier artifact.
It is a local human review layer only.
It does not define runtime execution, provider calls, routing, forwarding, or truth mutation.

## Purpose

The purpose of a Studio dossier is to gather already-existing bounded Studio artifacts into one deterministic local review object that a human can inspect more quickly.
A dossier improves readability and review consolidation.
It does not create a new authority layer.

## What a Studio dossier is

A Studio dossier is:

- local JSON only
- proposal-only
- bounded to human-readable review consolidation
- allowed to summarize source packet, proposal-layer artifacts, review records, gate reports, and bundle context
- non-executive and non-mutating

A Studio dossier is not:

- registry truth
- a runtime review object
- an approval token
- a forwarding command
- a hidden promotion mechanism
- a card or index mutation instruction

## Allowed included artifact types

A Studio dossier may include only these artifact types:

- `studio_intake_packet`
- `proposal_artifact`
- `handoff_artifact`
- `reference_artifact`
- `card_review_target_artifact`
- `review_record`
- `gate_report`

A dossier may also point to one local `studio_bundle_manifest` via `bundle_manifest_ref`.
That reference remains descriptive only.

## Forbidden included artifact classes

The following may not appear in a Studio dossier:

- runtime review objects
- MEC or operator state artifacts
- provider execution artifacts
- registry truth records
- card write instructions
- index write instructions
- alias write instructions

## Required sections

A Studio dossier must keep these sections explicit in machine-readable form:

- dossier metadata
- source packet summary
- included proposal artifacts
- included review records
- included gate reports
- bundle or manifest context
- open conflicts
- gate outcomes
- recommended human next step
- forbidden automated next steps
- proposal-only and boundary flags

## Optional sections

A Studio dossier may additionally include:

- `bundle_manifest_ref`
- `notes`
- extra descriptive title text
- extra context that shortens later human reading

Optional sections may clarify the case but must not add routing or execution semantics.

## Forbidden sections

The following are forbidden in a Studio dossier:

- runtime action plans
- provider execution plans
- auto-forward instructions
- approval issuance sections
- truth mutation targets
- card mutation targets
- index mutation targets
- alias mutation targets

## Required posture

A Studio dossier must keep the following posture explicit:

- `dossier_scope` is `local_human_review_only`
- `proposal_only` is `true`
- `no_truth_mutation` is `true`
- `no_runtime_write` is `true`
- `recommended_human_next_step` is descriptive only
- `forbidden_automated_next_steps` stays explicit

## Consistency rules

A Studio dossier is locally consistent when at minimum:

- `source_packet_ref` points to an included `studio_intake_packet`
- every entry in `included_proposal_refs` points to an included proposal-like artifact
- every entry in `review_refs` points to an included `review_record`
- every entry in `gate_report_refs` points to an included `gate_report`
- every summarized gate outcome matches an included gate report
- open conflicts from included artifacts remain visible in the dossier
- bundle references, if present, do not drift from dossier review and gate references
- dossier text does not imply approval, auto-forwarding, runtime write, or truth mutation

## Recommended human next step

A dossier may summarize only bounded human-readable next steps such as:

- `retain_in_review_layer`
- `manual_design_followup`
- `request_human_decision`
- `human_registry_review`
- `archive_only`

These values are descriptive only.
They do not authorize forwarding.

## Forbidden automated next steps

A dossier must explicitly forbid at least these automated next steps:

- `runtime_review_object_creation`
- `truth_mutation`
- `card_write`
- `index_write`
- `alias_write`
- `auto_forwarding`
- `provider_execution`

## Proposal-only and boundary limits

A Studio dossier must remain inside the local human review layer.
It may not:

- mutate registry truth
- create runtime state
- silently forward artifacts
- collapse open conflict into approval
- substitute for explicit human review

## Reading note

A dossier exists to shorten human review time across already-created Studio artifacts.
It does not replace inspecting the source artifacts when the case is important or conflict-bearing.

## Closure statement

This dossier spec exists to consolidate bounded Studio artifacts into a readable local review object without creating runtime authority, truth mutation, routing semantics, or a second decision system.
