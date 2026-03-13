# AICOS Studio Trace Consistency Rules

## Status

This document defines additive trace-consistency rules for the existing AICOS Studio bundle manifest layer.
It is a local checking discipline only.
It does not define forwarding, runtime execution, or truth mutation.

## Purpose

The purpose of trace consistency is to keep bundle manifests, review records, and gate reports mutually interpretable.
It makes local package trace paths easier to audit without turning trace checks into workflow automation.

## Rule 1 — Included subject rule

If a bundle includes a review record or gate report in its local review context, that artifact should point to a `subject_ref` already present in `included_artifacts`.

Interpretation:

- review context should stay inside the local package
- cross-package subject jumps are considered trace drift

## Rule 2 — Subject type match rule

If a review record or gate report points to an included subject, the declared `subject_artifact_type` should match the included artifact type for that same ref.

Interpretation:

- a ref and its declared artifact type should not disagree
- mismatched subject typing weakens local auditability

## Rule 3 — Topic legibility rule

Bundle topic, review topics, and gate topics should remain legibly related.
A bundle must not claim one bounded package topic while its review or gate records speak about materially different topics.

Interpretation:

- exact wording equality is not required
- obvious drift or unrelated topics should be flagged
- this remains a trace lint, not a schema prohibition

## Rule 4 — No implicit approval rule

A bundle must not imply that local consistency, gate passes, or review packaging alone equal approval, authorization, or canon truth.

Examples of forbidden implication:

- bundle text that says approval is granted by packaging
- bundle text that says forwarding is automatic
- bundle text that treats review context as execution authority

## Rule 5 — No runtime or truth trace rule

Review context trace must not point into runtime or truth-facing surfaces.
This includes:

- `runtime/**`
- runtime review objects
- `cards/**`
- `index/INDEX.json`
- `index/ALIASES.json`

## Rule 6 — Review/gate trace pairing rule

If a bundle declares `review_refs` or `gate_report_refs`, those refs should remain consistent with the actual included review and gate artifacts.
If a review record names gate reports by identifier, those identifiers should correspond to gate reports included in the same bundle.

## Allowed outcomes of trace checking

Trace checking may conclude that a package is:

- `consistent`
- `needs_review`
- `incomplete`
- `conflict_present`

These values remain descriptive only.
They do not authorize any next step.

## Boundary rule

Trace consistency rules are auditing aids only.
They may not be interpreted as:

- routing authority
- approval authority
- runtime readiness
- canon readiness
- replacement for explicit human review

## Closure statement

These trace consistency rules exist to strengthen local package readability and auditability across bundle manifests, review records, and gate reports without creating runtime authority, truth mutation, or hidden forwarding semantics.
