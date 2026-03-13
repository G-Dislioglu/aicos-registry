# AICOS Studio Intake Charter

## Status

This charter defines the repo-near intake and proposal boundary for AICOS Studio / Maya Council outputs.
It is a contract for how studio-originated ideas may be represented without mutating registry truth or blending into MEC/runtime review.

## Purpose

AICOS Studio / Maya Council exists to support structured exploratory thinking around:

- multi-agent debate
- multi-provider comparison
- challenge and counter-position generation
- distillation of competing views into proposal-ready artifacts
- explicit user-gated next-step recommendations

Its purpose is to improve proposal quality.
It is not a hidden promotion path into registry truth.

## What Studio may produce

Studio may produce only proposal-layer artifacts such as:

- conversation artifacts
- debate summaries
- challenge logs
- distilled proposal packets
- recommendation packets for later human review
- explicit open-conflict records

These artifacts may be repo-near reference material.
They are not canon by default.

## What Studio must not do

Studio must not:

- write directly into `cards/`
- mutate `index/INDEX.json`
- create alias truth in `index/ALIASES.json`
- create runtime review state in MEC or other runtime review layers
- silently promote a debate result into registry truth
- treat provider agreement as proof of canon truth
- create an auto-promotion path from discussion to canon

## Proposal vs truth boundary

The boundary is strict:

- discussion can produce ideas
- ideas can become proposal artifacts
- proposal artifacts can become review targets
- review targets do not become registry truth without explicit later human action outside this charter

This means:

- conversation output is not truth
- distilled output is not truth
- recommendation output is not truth
- registry truth remains the card/index surface already governed by separate registry workflows

## Maya role

Within Studio, Maya may operate only in bounded roles:

- `moderator`
- `observer`
- `distillator`

### Moderator

As moderator, Maya may:

- frame the topic
- enforce turn boundaries
- request clarification
- surface unresolved disagreements
- keep the debate inside scope

### Observer

As observer, Maya may:

- summarize what each participant actually claimed
- separate direct claims from inference
- note missing evidence or ambiguity
- record drift-risk signals

### Distillator

As distillator, Maya may:

- compress a multi-party discussion into a proposal-ready packet
- preserve disagreement and uncertainty explicitly
- produce a bounded recommendation scope for later review

Maya must not:

- silently rewrite debate output into canon truth
- collapse unresolved conflict into false certainty
- act as an autonomous promotion authority

## External experts and providers

External experts and model providers may participate as bounded inputs.
Their role is advisory.

They may:

- provide independent first-pass views
- challenge each other
- contribute evidence or counterexamples
- improve the breadth of explored options

They must not:

- define canon truth by consensus alone
- bypass user review
- write directly into registry truth or runtime review state

## Independent first pass

A studio intake should begin with independent first-pass contributions when possible.
The purpose is to reduce premature convergence.

Expected rule:

- participants answer before seeing a shared distilled conclusion
- early synthesis should not erase independent disagreement

## Challenge phase

A valid studio intake may include a challenge phase.
This phase is for:

- contradiction finding
- boundary testing
- counterexample pressure
- provider disagreement exposure

Challenge exists to improve proposal quality, not to produce automatic rejection or promotion.

## Distillation phase

A valid studio intake may include a distillation phase.
Distillation may:

- compress the discussion
- extract the strongest bounded proposal candidate
- identify what remains unresolved
- narrow the next review target

Distillation must preserve:

- claim status
- evidence status
- challenge status
- open conflicts
- drift risk

## User gate

User gate is mandatory before any studio output is treated as a candidate for later truth-facing work.
The user gate decides whether a distilled studio output is:

- ignored
- archived as conversation only
- kept as a proposal artifact
- forwarded to a later review target

The user gate does not itself perform promotion.

## No auto-promotion path

This charter forbids an automatic path from:

- studio discussion
- to distilled packet
- to registry truth

Any future truth-facing move must remain:

- explicit
- human-directed
- outside this intake charter
- traceable as a separate action

## Boundary to runtime and MEC

This charter does not define:

- MEC runtime review objects
- operator actions
- runtime review state machines
- provider execution integration
- UI surfaces

Studio intake artifacts must remain separate from:

- registry truth
- runtime review objects
- MEC review state

## Closure statement

AICOS Studio / Maya Council is proposal-only under this charter.
It may enrich how ideas are explored, challenged, and distilled.
It may not silently become a second truth system.
