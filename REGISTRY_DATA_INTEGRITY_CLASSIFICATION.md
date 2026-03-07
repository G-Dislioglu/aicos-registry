# REGISTRY_DATA_INTEGRITY_CLASSIFICATION

Stand: 2026-03-07
Status: Phase 0.2B read-only classification
Scope basis:
- `M01` Registry Core
- `M02` Taxonomy & Alias Layer
- `M03` Validation & Generation
- `M04` read-only only insofar as current browse/reference readability is assessable

## 1. Purpose

This document classifies the non-mechanical registry integrity issues identified after Phase 0.2A.

It is intentionally read-only.
It does not repair cards, taxonomies, aliases, or broken references.
It exists to separate:
- issues that are later repairable with low ambiguity
- issues that require semantic judgment
- issues that should remain unresolved until a broader content decision is made

## 2. Scope

Included in scope:
- `cards/`
- `taxonomies/domains.json`
- `taxonomies/tags.json`
- `index/ALIASES.json`
- `index/INDEX.json`
- `tools/validate-taxonomy.js`
- `tools/generate-index.js`
- `tools/generate-human-registry.js`
- `README.md`
- `REGISTRY_CONSISTENCY_AUDIT.md`

Excluded from scope:
- direct card repairs
- taxonomy edits
- alias edits
- runtime/UI/API work
- module lock / architecture / phase plan changes
- structural migration

## 3. Classification Method

Classification was based on these read-only checks:
- compare used `domain` values against `taxonomies/domains.json`
- compare used `tags` values against `taxonomies/tags.json`
- group unknown tags by prefix family: `theme:`, `system:`, `domain:`, `role:`, `other`
- scan unresolved `links.fixes`, `links.causes`, `links.related`, `links.supersedes`
- compare unresolved targets against real card IDs and `index/ALIASES.json`
- inspect nearby numeric card ranges to distinguish likely typo from likely never-created target
- inspect affected source cards to understand whether missing targets are central to card meaning or merely optional related references

Confidence terms in this document:
- **high**: strong direct repo evidence
- **medium**: plausible with some unresolved semantic ambiguity
- **low**: insufficient repo evidence for a stronger claim

## 4. Taxonomy Drift Classification

### A. Unknown domains

| Value | Count | Cards affected | Classification | Recommended repair action | Confidence |
|---|---:|---|---|---|---|
| `biology` | 6 | `sol-bio-047`, `sol-bio-048`, `sol-bio-049`, `sol-bio-050`, `sol-bio-051`, `sol-bio-052` | missing taxonomy entry | add as explicit domain entry if this biological analogy cluster is kept active | high |
| `optimization` | 1 | `sol-bio-048` | missing taxonomy entry | either add as domain or normalize into `systems`; decide once domain granularity rule is stated | medium |
| `memory` | 2 | `sol-bio-049`, `sol-bio-050` | ambiguous | decide whether `memory` is a first-class domain or should stay expressed via tags/theme only | medium |
| `learning` | 1 | `sol-bio-051` | ambiguous | decide whether `learning` is a stable domain or should be normalized into `systems`/`ai_governance` plus tags | medium |
| `multi_agent` | 2 | `sol-bio-052`, `sol-cross-055` | missing taxonomy entry | add as domain if multi-agent architecture remains an active registry concept | high |

### Domain-level classification summary

- **safe mechanical later**
  - `biology`
  - `multi_agent`

- **requires manual judgment**
  - `optimization`
  - `memory`
  - `learning`

- **should remain unresolved for now**
  - none at the domain level, provided a 0.2C repair pass explicitly decides domain-granularity policy first

### B. Unknown tags

Observed unknown tag usage groups:
- `theme:*`: `117` unique / `166` total uses
- `system:*`: `0` unique / `0` total uses
- `domain:*`: `0` unique / `0` total uses
- `role:*`: `0` unique / `0` total uses
- `other`: `20` unique / `31` total uses

#### `theme:*`

- **Unique count**: `117`
- **Total usage count**: `166`
- **Top examples**:
  - `theme:agent_workflow` (`5`)
  - `theme:fail_fast` (`4`)
  - `theme:multi_agent` (`4`)
  - `theme:provider_routing` (`4`)
  - `theme:cost_control` (`3`)
  - `theme:data_persistence` (`3`)
  - `theme:guards` (`3`)
  - `theme:knowledge_management` (`3`)
  - `theme:parsing` (`3`)
  - `theme:solo_dev` (`3`)
  - `theme:ux_guard` (`3`)
- **Classification**: missing taxonomy entries, but in an uncontrolled and semantically mixed expansion pattern
- **Recommended repair action**:
  - do not bulk-add all unknown `theme:*` tags
  - first split into coherent sub-buckets such as delivery/agent-workflow, resilience/runtime, conceptual-biology, G-MIND/formalism, UX/frontend
  - then add only the stable subset that is clearly intended as controlled vocabulary
- **Confidence**: high on “missing taxonomy coverage exists”, medium on “every unknown theme tag deserves admission”

#### `system:*`

- **Unique count**: `0`
- **Total usage count**: `0`
- **Top examples**: none
- **Classification**: no active drift in this group
- **Recommended repair action**: none
- **Confidence**: high

#### `domain:*`

- **Unique count**: `0`
- **Total usage count**: `0`
- **Top examples**: none
- **Classification**: no active drift in this group
- **Recommended repair action**: none
- **Confidence**: high

#### `role:*`

- **Unique count**: `0`
- **Total usage count**: `0`
- **Top examples**: none
- **Classification**: no active drift in this group
- **Recommended repair action**: none
- **Confidence**: high

#### `other`

- **Unique count**: `20`
- **Total usage count**: `31`
- **Top examples**:
  - `risk:high` (`3`)
  - `env:onedrive` (`2`)
  - `tech:database` (`2`)
  - `tech:json` (`2`)
  - `tech:native_module` (`2`)
  - `tech:security` (`2`)
  - `tech:tts` (`2`)
  - `tech:vite` (`2`)
  - `tech:web_speech_api` (`2`)
  - `tech:websocket` (`2`)
- **Internal pattern**:
  - `tech:*`: `13` unique / `21` total uses
  - `risk:*`: `6` unique / `8` total uses
  - `env:*`: `1` unique / `2` total uses
- **Classification**: mixed
  - many `tech:*` values look like genuine missing taxonomy entries
  - `risk:*` is partly missing taxonomy coverage, partly inconsistent risk-granularity policy
  - `env:onedrive` behaves like a legacy or ad hoc environment tag family not yet represented in the taxonomy file
- **Recommended repair action**:
  - split this bucket in 0.2C into `tech`, `risk`, and `env` repair decisions
  - add only values that reflect durable controlled vocabulary
  - avoid expanding taxonomy by one-off environment trivia unless explicitly desired
- **Confidence**: high on mixed-bucket diagnosis, medium on exact admit/reject decisions

### Taxonomy drift synthesis

- **safe mechanical later**
  - add clearly durable missing domain entries: likely `biology`, likely `multi_agent`
  - add clearly durable `tech:*` entries already used across multiple active cards

- **requires manual judgment**
  - whether conceptual fields like `memory`, `learning`, `optimization` belong in `domain` or should remain tag/theme-level only
  - whether the current thematic explosion is intended controlled vocabulary or unconstrained authoring drift
  - whether `risk:*` should encode severity, failure mode, or both

- **should remain unresolved for now**
  - the long tail of one-off `theme:*` entries until a tighter taxonomy admission rule exists

## 5. Broken Reference Classification

### C. Unresolved references

| Source card | Field path | Missing target | Classification | Recommended repair action | Confidence |
|---|---|---|---|---|---|
| `err-api-01` | `links.fixes` | `sol-api-01` | deleted/never-created target | manually decide whether an API-specific fix card should exist or whether `sol-api-02` already supersedes it conceptually | medium |
| `sol-bio-047` | `links.related` | `sol-cross-048` | deleted/never-created target | keep unresolved until the missing `sol-cross-047..052` block is intentionally created or references are re-mapped | high |
| `sol-bio-047` | `links.related` | `sol-cross-051` | deleted/never-created target | same as above | high |
| `sol-bio-048` | `links.related` | `sol-cross-047` | deleted/never-created target | same as above | high |
| `sol-bio-048` | `links.related` | `sol-cross-049` | deleted/never-created target | same as above | high |
| `sol-bio-049` | `links.related` | `sol-cross-047` | deleted/never-created target | same as above | high |
| `sol-bio-049` | `links.related` | `sol-cross-050` | deleted/never-created target | same as above | high |
| `sol-bio-050` | `links.related` | `sol-cross-049` | deleted/never-created target | same as above | high |
| `sol-bio-050` | `links.related` | `sol-cross-051` | deleted/never-created target | same as above | high |
| `sol-bio-051` | `links.related` | `sol-cross-047` | deleted/never-created target | same as above | high |
| `sol-bio-051` | `links.related` | `sol-cross-050` | deleted/never-created target | same as above | high |
| `sol-bio-051` | `links.related` | `sol-cross-052` | deleted/never-created target | same as above | high |
| `sol-bio-052` | `links.related` | `sol-cross-051` | deleted/never-created target | same as above | high |
| `sol-bio-052` | `links.related` | `sol-cross-047` | deleted/never-created target | same as above | high |
| `sol-cross-029` | `links.fixes` | `err-ui-02` | deleted/never-created target | manually decide whether `err-ui-02` should be restored as a real error card or these fixes should be re-pointed | medium-high |
| `sol-cross-040` | `links.related` | `sol-dev-004` | deleted/never-created target | manually decide whether a missing model/coding workflow card was intended or whether this link should be removed/replaced | medium |
| `sol-dev-006` | `links.related` | `meta-008` | deleted/never-created target | manually decide whether there was a planned meta card beyond `meta-007` or whether this is a stale conceptual pointer | medium-high |
| `sol-trading-001` | `links.related` | `sol-trading-002` | deleted/never-created target | manually decide whether a second trading card was planned or this related link should be removed | medium |
| `sol-ux-002` | `links.fixes` | `err-ui-02` | deleted/never-created target | same as `sol-cross-029 -> err-ui-02` | medium-high |

### Broken-reference cluster analysis

#### Bio/Cross block (`sol-cross-047` through `sol-cross-052`)

This is the clearest structural cluster.
Repo evidence suggests:
- `sol-cross-040` through `sol-cross-046` exist
- `sol-cross-047` through `sol-cross-052` do not exist
- `sol-cross-053` through `sol-cross-055` exist
- six biology cards introduced on `2026-03-05` point into that exact missing range

**Classification**:
- deleted/never-created target block, not a likely single-character typo

**Reason**:
- the missing targets form a continuous conceptual block rather than isolated random misses
- surrounding numeric ranges are populated, which suggests planned-but-not-materialized cards rather than accidental misspelling

**Repair posture**:
- should remain unresolved until a content-level decision is made:
  - create the missing conceptual cross-cards
  - or remap these references to existing cards after semantic review

**Confidence**: high

#### `err-ui-02`

Repo evidence suggests:
- referenced by `sol-cross-029` and `sol-ux-002`
- no `err-ui-02.json` exists
- existing nearby UI/dev errors (`err-ui-01`, `err-dev-002`) do not obviously match the same semantic shape

**Classification**:
- deleted/never-created target

**Repair posture**:
- requires manual judgment
- do not alias automatically to `err-ui-01` or `err-dev-002`

**Confidence**: medium-high

#### `sol-api-01`, `sol-dev-004`, `meta-008`, `sol-trading-002`

Repo evidence suggests:
- none of these targets exist
- none are covered by aliases
- each appears as an isolated missing target rather than part of a live alias policy

**Classification**:
- deleted/never-created target

**Repair posture**:
- requires manual judgment per case
- likely not safe for alias-first repair without evidence of a rename

**Confidence**: medium

### Broken-reference synthesis

- **safe mechanical later**
  - none of the broken references are safe mechanical repairs without semantic choice

- **requires manual judgment**
  - `err-ui-02`
  - `sol-api-01`
  - `sol-dev-004`
  - `meta-008`
  - `sol-trading-002`

- **should remain unresolved for now**
  - the entire `sol-cross-047..052` missing block, until the intended conceptual set is decided

## 6. Alias/Legacy Considerations

### D. Alias relevance

Current alias policy in `index/ALIASES.json` covers only:
- `sol-maya-001` → `meta-001`
- `sol-maya-002` → `meta-002`
- `sol-maya-003` → `meta-003`
- `sol-maya-004` → `meta-004`
- `sol-maya-005` → `meta-005`

Findings:
- none of the currently broken targets are resolved by existing aliases
- none of the broken targets show strong repo evidence of a completed rename pattern comparable to the `sol-maya-*` migration
- the missing targets mostly look like never-created or concept-only placeholders, not renamed IDs

Alias relevance judgment:
- **low for immediate repair**
- **possible later only if human review confirms a true rename target**

Examples:
- `meta-008` has no alias trail and no corresponding `meta-*` file
- `err-ui-02` has no alias trail and no clearly equivalent existing error card
- `sol-cross-047..052` have no alias trail and behave like a missing planned block, not renamed files

Recommended alias policy stance for 0.2C:
- use aliases only when there is concrete rename evidence
- do not use aliases to paper over missing concept cards

## 7. Recommended Repair Buckets

### Bucket 1: Safe mechanical later

Low-ambiguity follow-up work after explicit approval:
- add clearly durable taxonomy entries with repeated real usage
- optionally add validator reporting that distinguishes “missing taxonomy entry” from “ambiguous vocabulary expansion”
- add a dedicated link-integrity validator report so unresolved targets remain visible even before repair

### Bucket 2: Requires manual judgment

Needs semantic review before any change:
- whether `memory`, `learning`, `optimization` deserve first-class domain status
- whether the unknown `theme:*` expansion reflects intended vocabulary or uncontrolled authoring
- whether `err-ui-02`, `sol-api-01`, `sol-dev-004`, `meta-008`, `sol-trading-002` should exist, be removed, or be remapped

### Bucket 3: Should remain unresolved for now

Do not repair until higher-level content decisions are made:
- the `sol-cross-047..052` missing conceptual block
- long-tail one-off theme tags with no clear admission rule
- any alias proposal that lacks concrete rename evidence

## 8. Safe Repair Order

1. **Link-integrity visibility first**
   - add or run a validator that reports broken references deterministically

2. **Decide domain granularity policy**
   - settle whether conceptual areas like `memory`, `learning`, `optimization`, `multi_agent` belong in `domain`

3. **Repair clearly durable taxonomy gaps**
   - only after step 2

4. **Resolve isolated broken targets with human judgment**
   - `err-ui-02`
   - `sol-api-01`
   - `sol-dev-004`
   - `meta-008`
   - `sol-trading-002`

5. **Decide fate of the `sol-cross-047..052` conceptual block**
   - create it intentionally, remap references, or explicitly delete those relations

6. **Normalize remaining long-tail tag vocabulary**
   - only after the higher-confidence repairs are done

## 9. Explicit Non-Goals

This phase does not:
- repair cards
- edit taxonomies
- add aliases
- relink broken references
- create missing conceptual cards
- decide runtime/UI/API behavior
- change module lock or architecture documents

## 10. Go/No-Go Recommendation for Phase 1

Recommendation: **No-Go for Phase 1 until a small 0.2C repair pass is completed.**

Reasoning:
- taxonomy drift is still materially unresolved
- broken references are still present in active registry content
- several missing targets require semantic judgment before Phase 1 can rely on registry integrity as an operational baseline
- the current state is much better after 0.2A, but still not stable enough to treat the registry as fully trustworthy for Phase 1 read/use workflows

Minimum acceptable 0.2C outcome before reconsidering Phase 1:
- a conscious decision on domain granularity
- a conscious decision on isolated broken targets
- explicit treatment of the `sol-cross-047..052` gap
- taxonomy status moved from ambiguous failure to intentionally accepted baseline or passing baseline
