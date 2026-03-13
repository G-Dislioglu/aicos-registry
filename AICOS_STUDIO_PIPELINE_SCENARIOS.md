# AICOS Studio Pipeline Scenarios

## Status

This document defines bounded end-to-end Studio reference scenarios.
They are local reference pipelines only.
They do not define runtime execution, approval authority, or truth mutation.

## Purpose

The scenario corpus exists to prove that the existing Studio layers compose coherently across realistic local flows:

- intake packet capture
- normalization and allowed conversion
- review and gate artifacts
- bundle and manifest packaging
- trace-consistent local review packaging

## Scenario 1 — Idea to proposal flow

### Start artifact

- one `studio_intake_packet`

### Allowed intermediate steps

- local normalization of the packet if needed
- `studio_intake_packet -> proposal_artifact`
- proposal-only gate review
- review-layer hold posture

### Gates used

- `proposal_only_gate`

### Allowed conversions

- `studio_intake_packet -> proposal_artifact`

### Review and gate artifacts

- one `gate_report` over the proposal artifact
- one `review_record` keeping the proposal in review-layer posture

### Forbidden alternative paths

- direct runtime review object creation
- direct truth mutation or card write
- direct bundle-to-truth promotion

## Scenario 2 — Idea to handoff flow

### Start artifact

- one `studio_intake_packet`

### Allowed intermediate steps

- local normalization if needed
- gated `studio_intake_packet -> handoff_artifact`
- handoff-quality gate review
- review-layer forward posture into later human decision context only

### Gates used

- `handoff_quality_gate`
- `no_runtime_write_gate`
- `conflict_visibility_gate`
- `user_gate`

### Allowed conversions

- gated `studio_intake_packet -> handoff_artifact`

### Review and gate artifacts

- one `gate_report` over the handoff artifact
- one `review_record` describing the later human-owned posture

### Forbidden alternative paths

- any runtime dispatch
- any truth mutation
- any approval claim that bypasses the user gate

## Scenario 3 — Contradiction to review flow

### Start artifact

- one contradiction-oriented `studio_intake_packet`

### Allowed intermediate steps

- local normalization if needed
- `studio_intake_packet -> proposal_artifact`
- evidence gate soft-fail in local review
- review-layer hold posture that keeps contradiction visible

### Gates used

- `evidence_gate`

### Allowed conversions

- `studio_intake_packet -> proposal_artifact`

### Review and gate artifacts

- one `gate_report` with `soft_fail`
- one `review_record` with `hold`

### Forbidden alternative paths

- forced closure of unresolved contradiction
- silent approval inference from provider convergence
- runtime or truth shortcutting

## Scenario 4 — Review to bundle flow

### Start artifact

- one `studio_intake_packet`

### Allowed intermediate steps

- local normalization if needed
- `studio_intake_packet -> proposal_artifact`
- gated `studio_intake_packet -> card_review_target_artifact`
- review-layer forward posture into later bounded registry review
- bundle manifest packaging with trace-consistent references

### Gates used

- `proposal_only_gate`
- `card_review_target_gate`
- `evidence_gate`
- `conflict_visibility_gate`
- `user_gate`

### Allowed conversions

- `studio_intake_packet -> proposal_artifact`
- gated `studio_intake_packet -> card_review_target_artifact`

### Review and gate artifacts

- one `gate_report`
- one `review_record`
- one `studio_bundle_manifest`

### Forbidden alternative paths

- direct registry mutation
- card or index mutation
- trace drift between bundle topic and review/gate topic
- automatic forwarding into runtime or truth surfaces

## Invalid scenario classes

The corpus also contains deliberately invalid scenarios for:

- forbidden direct truth path
- forbidden runtime path
- bundle trace drift
- gated conversion attempted without the required review target posture

## Corpus location

Scenario files live under:

- `examples/studio/scenarios/`

Each scenario directory contains a local reference set plus a `scenario.json` descriptor consumed by the pipeline verifier.

## Closure statement

These scenarios are not workflow automation.
They are bounded local proofs that the Studio intake, conversion, review, gate, bundle, and trace layers remain proposal-only, auditable, and non-executive when composed together.
