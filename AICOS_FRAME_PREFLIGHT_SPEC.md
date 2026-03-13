# AICOS Frame Preflight Spec

## Purpose

Frame preflight is a shadow-only step that asks whether a task is being understood inside the right frame before decomposition starts.
It is meant to expose framing risk, not to silently replace human judgment or to turn every case into a clarification loop.

## Boundary

Frame preflight is:

- local
- proposal-safe
- evaluation-only
- non-authoritative
- non-executive

Frame preflight is not:

- a runtime action plan
- a registry write request
- an approval surface
- a substitute for the existing Studio review or gate layer

## Inputs

A preflight may inspect:

- a Studio intake packet
- a proposal artifact
- a repo-near scenario description
- a bounded task prompt

It may not assume direct access to runtime state, operator control surfaces, or registry truth authority.

## Output contract

A valid preflight emits one bounded artifact with these core fields:

- `artifact_type`
- `subject_ref`
- `task_frame_summary`
- `assumed_goal`
- `explicit_constraints`
- `latent_frame_risks`
- `missing_but_decisive_questions`
- `frame_risk_band`
- `frame_risk_signals`
- `decomposition_readiness`
- `recommended_next_move`

## Required interpretation rules

### `missing_but_decisive_questions`

This field exists to expose decisive uncertainty in the frame.
It must not mutate into a default “ask the user more questions” loop.
The goal is to mark where decomposition would likely become false precision.

### `frame_risk_band`

Only these values are allowed:

- `low`
- `medium`
- `high`

A single numeric `frame_risk_score` is forbidden.
The phrase `frame_risk_score is forbidden` is part of the shadow-track boundary and must stay true.

### `recommended_next_move`

Only bounded next-move language is allowed:

- `proceed`
- `challenge`
- `narrow`
- `stop`

These values are local advisory signals only.
They do not authorize action.

## Example posture bands

### Low risk

Use `low` when the goal is explicit, constraints are already grounded, and the missing questions do not threaten the core framing.

### Medium risk

Use `medium` when the core goal is plausible but constraint drift, hidden scope growth, or missing signal coverage could distort decomposition.

### High risk

Use `high` when the current framing would likely produce work that is elegant but mis-aimed, such as hidden truth mutation, fake consensus, or unjustified certainty.

## Forbidden patterns

The following are forbidden in a frame preflight artifact:

- approval claims
- truth authority claims
- runtime application targets
- registry mutation targets
- operator routing commands
- single-number `frame_risk_score`

## Separation from existing Studio layers

Frame preflight is earlier and narrower than review, gate, bundle, or dossier logic.
It does not replace those layers.
It only exposes whether the current problem understanding is fit to enter decomposition.

## Closure

Frame preflight exists to make framing risk visible before decomposition without creating a second truth system, a new authority surface, or a hidden replacement for the Studio baseline.
