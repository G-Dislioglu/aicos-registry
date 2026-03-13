# AICOS Studio Bundle Review Context

## Status

This document defines how review records and gate reports are read inside the existing AICOS Studio bundle layer.
It is a local review-context interpretation only.
It does not define forwarding, runtime execution, or truth mutation.

## Purpose

The purpose of bundle review context is to explain how a bundle manifest, its included artifacts, and its review-layer artifacts should be read together.
It keeps review interpretation legible without turning a bundle into a decision engine.

## Review context boundary

Bundle review context is:

- local and repo-near only
- proposal-only
- additive to the existing bundle and manifest layer
- allowed to describe bounded trace relationships across included artifacts

Bundle review context is not:

- approval
- forwarding authority
- runtime readiness
- registry truth
- a hidden workflow engine

## How review records are interpreted inside a bundle

A review record inside a bundle is read as a bounded statement about one included Studio artifact.
That means:

- the review record should point to an included `subject_ref`
- the review record `subject_artifact_type` should match the included artifact type for that ref
- a review record may describe later human review posture, but only as descriptive review-layer outcome
- a review record does not cause bundle forwarding

If a review record includes `gate_report_refs`, those refs should resolve to gate reports already present in the same bundle review context.
Those links remain descriptive trace links only.

## How gate reports are interpreted inside a bundle

A gate report inside a bundle is read as a bounded statement about one included Studio artifact.
That means:

- the gate report should point to an included `subject_ref`
- the gate report `subject_artifact_type` should match the included artifact type for that ref
- the gate report remains a local review-layer record only
- a gate pass does not convert the bundle into approval, canon, or runtime authority

## Allowed cross-reference patterns

The following patterns are allowed inside bundle review context:

- bundle manifest references included `review_record` files through `review_refs`
- bundle manifest references included `gate_report` files through `gate_report_refs`
- review records point to included artifacts through `subject_ref`
- gate reports point to included artifacts through `subject_ref`
- review records name included gate reports by bounded review-layer identifiers such as `gate_report_id`

These patterns are allowed only when they remain local, descriptive, and proposal-safe.

## Forbidden trace patterns

The following patterns are forbidden inside bundle review context:

- review records that point outside bundled artifacts
- gate reports that point outside bundled artifacts
- review or gate traces that point into runtime surfaces
- review or gate traces that point into registry truth surfaces
- bundle text that claims approval, authorization, or automatic forwarding by packaging alone
- trace links that silently replace explicit human review

## Topic and trace discipline

Bundle review context should remain topically legible.
A bundle topic should not drift so far from bundled review and gate topics that trace reading becomes misleading.
Topic discipline is an auditability aid, not an execution rule.

## Proposal-only and boundary limits

Bundle review context must remain inside the local Studio review packaging layer.
It may not:

- mutate registry truth
- create runtime review state
- authorize forwarding
- claim that a gate pass equals approval
- claim that a review record equals canon truth

## Closure statement

This review-context document exists to make bundled Studio review traces interpretable and locally checkable without introducing runtime authority, truth mutation, or hidden bundle-to-approval behavior.
