# MEC_PHASE4A_IMPLEMENTATION_PLAN

Stand: 2026-03-09
Status: Phase 4A implementation plan

## 1. Purpose

This document defines the minimal implementation scope for MEC Phase 4A: Manual Challenge Pass & Counterexample Output.

The goal is to introduce the smallest real Phase 4 Challenge MVP slice on top of the existing MEC review desk and canonical `mec_review_workspace`.

Phase 4A must make challenge pressure visible and actionable without introducing a recommendation engine, review automation, queue orchestration, registry mutation, or a second truth.

## 2. Scope Boundaries

In scope:
- one additive `challenge_context` derived inside the canonical `mec_review_workspace`
- one compact contradiction-pressure bucket and readable challenge flags
- one explicit manual challenge path for a visibly selected primary candidate
- one proposal-only runtime `counterexample_candidate` output path from that manual challenge flow
- minimal CLI / HTTP / Operator additions only where required to expose the same phase surface
- one dedicated Phase 4A verifier and compact acceptance document

Out of scope:
- any new review outcome
- any recommendation, ranking, or priority engine
- any automatic re-review or reopen behavior
- any queue, assignment, batch orchestration, or governance platform logic
- any registry mutation or export / canon promotion
- any broad cross-candidate challenge sweep
- any second derived truth beside the canonical workspace plus separate raw artifacts
- any Phase-3 cosmetic-only extension that does not introduce a real challenge path

## 3. Locked Slice

Phase 4A is locked to a single-candidate manual challenge pass.

This means:
- the operator selects one visible primary candidate
- the system derives challenge readability from already visible runtime / canonical signals
- the system may create one proposal-only `counterexample_candidate` against that selected primary candidate
- no batch selection, no hidden cross-candidate seeding, and no autonomous follow-up actions are allowed

## 4. Minimal Repo Mapping

Phase 4A extends the current MEC runtime foundation:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `web/mec-operator.html`
- current MEC review workspace and review desk verifiers

Minimal new Phase 4A mapping:
- `MEC-04`: manual challenge pass and compact contradiction-pressure readability
- `M15`: runtime coordination updates for a single-candidate challenge create path
- `M16`: additive audit-friendly carry-through of challenge basis into a proposal-only counterexample artifact

## 5. Planned Behavior

### Additive canonical challenge context

Each workspace item may expose a compact additive `challenge_context` derived only from already visible signals such as:
- boundary linkage / integrity
- existing related `counterexample_candidate` artifacts
- contradiction-oriented signals already visible in the workspace
- prior review outcomes and rationale trace carry-through
- unresolved references or visible evidence gaps when they materially weaken the read

`challenge_context` must remain readable and inspectable.
It must not become a hidden scoring machine or decision substitute.

### Contradiction pressure boundary

Phase 4A may expose contradiction pressure only as:
- a small bucket
- small readable flags
- compact signal lists

It must not expose:
- a numeric score as the main decision object
- ranking over the wider candidate set
- automated recommendation behavior

### Manual challenge output path

The manual challenge path must:
- start from one visibly selected primary candidate
- stay explicit and operator-triggered
- create only a runtime, proposal-only `counterexample_candidate`
- preserve what is being refuted and which challenge basis was visible
- avoid any automatic review write, reopen logic, or canon-side consequence

## 6. Files to Create or Update

Create:
- `MEC_PHASE4A_IMPLEMENTATION_PLAN.md`
- `MEC_PHASE4A_MANUAL_CHALLENGE_COUNTEREXAMPLE_OUTPUT_ACCEPTANCE.md`
- `tools/verify-mec-phase4a-manual-challenge-counterexample-output.js`

Update:
- `tools/arena-lib.js`
- `tools/arena.js`
- `tools/arena-server.js`
- `web/mec-operator.html`
- `tools/verify-mec-phase3c-review-workspace.js`
- `tools/verify-mec-operator-ui-smoke.js`

## 7. Verification Goals

Phase 4A is locally satisfied if:
- canonical workspace items expose additive `challenge_context`
- contradiction pressure remains compact and inspectable
- the manual challenge path only creates proposal-only runtime `counterexample_candidate` artifacts
- the challenge create path stays tied to one explicit primary candidate
- the operator exposes a visible challenge surface without recommendation behavior
- existing Phase 3D through 3I surfaces do not regress
- registry files remain unchanged before and after verification
- no new review outcomes, queueing logic, or governance drift are introduced
