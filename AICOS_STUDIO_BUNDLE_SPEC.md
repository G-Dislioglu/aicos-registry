# AICOS Studio Bundle Spec

## Status

This document defines a repo-near bundle layer for AICOS Studio.
It is a local packaging description only.
It does not define runtime execution, provider calls, forwarding, or truth mutation.

## Purpose

The purpose of a Studio bundle is to describe which bounded Studio artifacts belong together as one local reviewable package.
It makes package membership, coverage, and local consistency legible without turning packaging into routing or execution.

## Bundle boundary

A Studio bundle is:

- local JSON only
- proposal-only and review-safe
- a packaging layer above individual Studio artifacts
- allowed to describe package completeness and bounded next-step posture

A Studio bundle is not:

- registry truth
- a runtime review object
- a forwarding command
- a card mutation instruction
- an index or alias mutation instruction
- a hidden execution path

## Allowed bundle members

A Studio bundle may include only bounded Studio artifact members:

- `studio_intake_packet`
- `proposal_artifact`
- `handoff_artifact`
- `reference_artifact`
- `card_review_target_artifact`
- `review_record`
- `gate_report`

These members remain descriptive only.
Bundle membership does not authorize forwarding, canonization, or runtime creation.

## Forbidden bundle members

The following may not appear as bundle members or implied bundle targets:

- runtime review objects
- registry truth objects
- `cards/**` write targets
- `index/INDEX.json` mutation targets
- `index/ALIASES.json` mutation targets
- provider execution payloads
- hidden approval tokens

A bundle must not be used to smuggle runtime state, truth mutation instructions, or execution semantics.

## Proposal-only boundary

A Studio bundle must remain proposal-only.
It may organize local artifacts for reading, checking, and later human review, but it may not:

- create runtime review state
- mutate registry truth
- auto-forward into review or truth
- bypass user gate requirements
- claim approval or canon by packaging alone

## Relationship to review layer

A bundle may reference review records and gate reports when those belong to the same local package.
This helps make the package auditable.
It does not create a second review engine.

## Relationship to routing

A bundle does not decide routing.
A bundle may describe an intended next step, but that field remains descriptive only.
No bundle field authorizes forwarding or execution.

## Relationship to manifests

A Studio bundle is described by a bounded manifest.
The manifest records package identity, included artifacts, boundary flags, and local consistency posture.
The manifest does not replace the underlying artifacts.

## Closure statement

This bundle spec exists to make Studio artifact groupings legible and locally checkable without opening runtime behavior, truth mutation, or hidden packaging-to-execution semantics.
