# MEC_PHASE4E_IMPLEMENTATION_PLAN

Stand: 2026-03-11
Status: Phase 4E implementation plan

## 1. Purpose

This document defines the minimal implementation scope for the next Phase 4 block: Challenge Dossier Review Digest & Consolidated Read Model.

The goal is to extend the canonical `mec_review_workspace` with one additive, read-first, context-first digest that consolidates the already-visible Phase 4A / 4B / 4C / 4D challenge surfaces into a compact review read for Desk, CLI, and HTTP without creating a second truth, new outcome, or recommendation layer.

## 2. Scope Boundaries

In scope:
- one additive canonical `challenge_dossier_review_digest` per workspace item, derived only from already-visible workspace signals
- consolidation of Phase 4C coverage posture, Phase 4D evolution posture, and Phase 4B refutation posture into one compact read model
- compact chronology over visible review anchor, challenge lines, and counterexample visibility
- compact unresolved watchpoints array drawn from already-visible gaps, contradiction signals, unresolved references, and refutation qualifiers
- minimal CLI and Operator additions to expose the same canonical Phase 4E digest surface
- one dedicated Phase 4E verifier and compact acceptance document

Out of scope:
- any new review outcome
- any recommendation, ranking, scoring, or decision engine
- any new write path or challenge creation variant
- any reopen, rerank, rereview, or queue logic
- any registry mutation or export / canon promotion
- any new source of truth beside `mec_review_workspace` plus separate raw artifacts
- any broad UI redesign or multi-surface workflow platform

## 3. Locked Slice

This slice is locked to one consolidated review digest over already-visible challenge dossier signals.

This means:
- Phase 4A remains the only manual challenge write path
- Phase 4B remains the base refutation readability layer
- Phase 4C remains the base challenge dossier coverage layer
- Phase 4D remains the dossier evolution / timing layer
- Phase 4E only consolidates those already-derived layers into one additive review digest
- no new canonical store, write artifact, or global sweep may be introduced

## 4. Minimal Repo Mapping

Phase 4E extends the current MEC review workspace foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`
- current MEC Phase 4A / 4B / 4C / 4D verifiers

Minimal new Phase 4E mapping:
- `MEC-04`: challenge carry-through becomes consolidated and review-readable at one digest surface while remaining compact and non-recommendatory
- `M15`: runtime coordination still exposes one canonical workspace surface over runtime artifacts only
- `M16`: audit-friendly consolidation over visible challenge signals without creating a second truth or implicit decision path

## 5. Planned Behavior

### Additive canonical digest

Each workspace item may expose additive `challenge_dossier_review_digest` derived only from already-visible signals such as:
- `challenge_dossier_context`
- `challenge_dossier_delta_context`
- `refutation_context`
- `contradiction_context`
- `decision_packet_context.missing_signals`
- unresolved runtime references already visible in the workspace
- the latest visible review anchor and visible counterexample timing

### Minimum digest fields

The digest must stay compact and readable. It should at least expose:
- `digest_role`
- `digest_bucket`
- `digest_summary`
- `coverage_read`
- `delta_read`
- `refutation_read`
- compact `chronology`
- compact `watchpoints`
- compact `digest_flags`

### Boundaries

It must not expose:
- recommended outcome
- reopen, rerank, rereview, or next-action automation
- queue position or assignment semantics
- a second derived truth detached from the canonical workspace
- any hidden scoring machine disguised as digest readability

## 6. Files to Create or Update

Create:
- `MEC_PHASE4E_IMPLEMENTATION_PLAN.md`
- `MEC_PHASE4E_CHALLENGE_DOSSIER_REVIEW_DIGEST_ACCEPTANCE.md`
- `tools/verify-mec-phase4e-challenge-dossier-review-digest.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `web/mec-operator.html`
- `tools/verify-mec-operator-ui-smoke.js`

## 7. Verification Goals

Phase 4E is locally satisfied if:
- canonical workspace items expose additive `challenge_dossier_review_digest`
- a primary candidate exposes a digest with readable coverage, delta, refutation, chronology, and watchpoints
- a counterexample contribution exposes a digest that remains anchored to the primary candidate
- CLI workspace output exposes compact digest and watchpoint readability
- HTTP workspace detail exposes the same canonical Phase 4E digest object
- existing Phase 4A, 4B, 4C, and 4D surfaces do not regress
- no recommendation, ranking, queue, or write-path drift is introduced
