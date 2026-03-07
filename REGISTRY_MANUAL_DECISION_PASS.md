# REGISTRY_MANUAL_DECISION_PASS

Stand: 2026-03-07
Status: Phase 0.2D manual decision pass
Scope basis:
- `M01` Registry Core
- `M02` Taxonomy & Alias Layer
- `M03` Validation & Generation
- `M04` read-only only insofar as unresolved references and taxonomy debt affect browse/readability

## 1. Purpose

This document prepares the remaining semantic registry decisions after Phase 0.2C.

It is intentionally decision-oriented and read-only.
It does not repair cards, taxonomies, aliases, or broken references.
It exists to make the next step explicit:
- what may be repaired in a narrow 0.2E pass
- what should remain consciously deferred
- when Phase 1 could become responsible to start

## 2. Scope

Included in scope:
- unresolved domain decisions for `memory`, `learning`, `optimization`
- unresolved broken-reference decisions for the required targets
- policy direction for the long-tail unknown `theme:*` set
- implications for a possible 0.2E fix pass and for Phase 1 readiness

Excluded from scope:
- direct repairs
- taxonomy edits
- card edits
- alias edits
- bulk normalization
- runtime/UI/API work
- new modules
- architecture or phase-plan changes

## 3. Open Domain Decisions

### `memory`

- **Current usage count**: `2`
- **Affected cards**:
  - `sol-bio-049`
  - `sol-bio-050`
- **Option A: add as domain**
  - recognizes memory as a first-class conceptual area
  - would reduce validator errors directly
  - risk: domain vocabulary becomes concept-heavy and less operational
- **Option B: normalize into existing domain(s)**
  - likely normalize into `systems` and/or leave meaning in tags/themes
  - preserves a tighter domain layer
  - avoids domain inflation for a concept that is already richly expressible elsewhere
- **Option C: defer**
  - keeps the question open until a broader domain policy exists
  - preserves current ambiguity
- **Preferred option**: **B: normalize into existing domain(s)**
- **Rationale**:
  - current usage is small and localized
  - `memory` behaves more like a conceptual lens than a stable operational domain in the current registry
  - keeping domain vocabulary tighter reduces future taxonomy sprawl
- **Confidence**: medium

### `learning`

- **Current usage count**: `1`
- **Affected cards**:
  - `sol-bio-051`
- **Option A: add as domain**
  - recognizes learning as an explicit domain area
  - solves the validator error immediately
  - risk: admits a single-use conceptual label into the top-level domain layer
- **Option B: normalize into existing domain(s)**
  - likely normalize into `systems` and/or `ai_governance` depending on intended framing
  - avoids one-off domain expansion
- **Option C: defer**
  - leaves the question open and the validator red
- **Preferred option**: **B: normalize into existing domain(s)**
- **Rationale**:
  - single-card usage is too weak to justify a new top-level domain
  - current evidence fits a conceptual/topic label better than a mature domain family
- **Confidence**: medium-high

### `optimization`

- **Current usage count**: `1`
- **Affected cards**:
  - `sol-bio-048`
- **Option A: add as domain**
  - recognizes optimization as a formal domain
  - resolves the validator error directly
  - risk: opens the door to broad abstract-discipline domains with weak current coverage
- **Option B: normalize into existing domain(s)**
  - most likely normalize into `systems`
  - keeps the domain layer operational rather than abstractly academic
- **Option C: defer**
  - postpones the choice but preserves known debt
- **Preferred option**: **B: normalize into existing domain(s)**
- **Rationale**:
  - current evidence is a single-use case within a biology-pattern card
  - `optimization` presently looks more like topical framing than a stable registry domain
- **Confidence**: high

## 4. Broken Reference Decision Matrix

### Isolated unresolved targets

| Source card | Field path | Missing target | Option A: remove stale reference | Option B: remap to existing target | Option C: defer unresolved | Preferred option | Rationale | Confidence |
|---|---|---|---|---|---|---|---|---|
| `err-api-01` | `links.fixes` | `sol-api-01` | possible but may delete intended fix relation | possible candidate: `sol-api-02`, but evidence is not strong enough | preserve unresolved until target intent is confirmed | **C** | there is not enough evidence that `sol-api-02` is the correct semantic successor, and removing a `fixes` link is riskier than deferring | medium |
| `sol-cross-029` | `links.fixes` | `err-ui-02` | possible but would erase an intended error/solution relation | no trustworthy existing remap target | preserve unresolved until whether `err-ui-02` should exist is decided | **C** | `fixes` is semantically stronger than `related`; removing it now would likely destroy intended meaning | medium-high |
| `sol-ux-002` | `links.fixes` | `err-ui-02` | possible but same risk as above | no trustworthy existing remap target | preserve unresolved until shared `err-ui-02` decision is made | **C** | same target is referenced by two solution cards, which suggests real intent rather than random noise | medium-high |
| `sol-cross-040` | `links.related` | `sol-dev-004` | remove isolated stale relation | no strong existing remap target | defer if preserving conceptual possibility is preferred | **A** | this is a single optional `related` edge with no alias evidence and no strong replacement candidate; removal is the cleanest likely outcome | medium |
| `sol-dev-006` | `links.related` | `meta-008` | possible, but may erase a meaningful meta-level relation | no trustworthy remap to existing `meta-*` target | preserve unresolved until meta-card intent is judged | **C** | meta references are semantically heavy, and there is no clear equivalent existing target | medium-high |
| `sol-trading-001` | `links.related` | `sol-trading-002` | remove stale sequel-like relation | no strong existing remap target | defer if a second trading card may still be intended | **A** | this is an isolated optional `related` edge in a sparse trading area; removal is lower risk than speculative remap | medium |

### Missing block decision

| Source group | Field path | Missing target(s) | Option A: remove stale reference(s) | Option B: remap to existing target(s) | Option C: defer unresolved | Preferred option | Rationale | Confidence |
|---|---|---|---|---|---|---|---|---|
| `sol-bio-047` through `sol-bio-052` | `links.related` | `sol-cross-047..052` | possible but would discard a coherent conceptual cluster | possible only with heavy semantic reinterpretation | preserve block unresolved as a single decision unit | **C** | the missing targets behave like a planned conceptual block, not accidental isolated typos; deciding them individually would be misleading | high |

## 5. Deferred Theme-Tag Policy

`theme:*` should **not** be repaired broadly in the next pass.

Current judgment:
- the long tail of unknown `theme:*` values should **remain consciously open for now**
- the family should **later receive its own taxonomy policy update**
- only after that policy exists should any restricted normalization happen

Recommended stance:
- **now**: keep `theme:*` debt explicit and do not bulk-admit values
- **later**: prepare a dedicated policy pass defining admission rules such as minimum reuse, semantic stability, and category fit
- **not in 0.2E**: no bulk normalization, no blind additions, no attempt to make the validator green by taxonomy inflation

## 6. Decision Options per Case

### Domain cases

- **`memory`**
  - A: add as domain
  - B: normalize into existing domain(s)
  - C: defer

- **`learning`**
  - A: add as domain
  - B: normalize into existing domain(s)
  - C: defer

- **`optimization`**
  - A: add as domain
  - B: normalize into existing domain(s)
  - C: defer

### Broken-reference cases

- **`sol-api-01`**
  - A: remove stale reference
  - B: remap to existing target
  - C: defer unresolved

- **`err-ui-02`**
  - A: remove stale reference(s)
  - B: remap to existing target
  - C: defer unresolved

- **`sol-dev-004`**
  - A: remove stale reference
  - B: remap to existing target
  - C: defer unresolved

- **`meta-008`**
  - A: remove stale reference
  - B: remap to existing target
  - C: defer unresolved

- **`sol-trading-002`**
  - A: remove stale reference
  - B: remap to existing target
  - C: defer unresolved

- **`sol-cross-047..052`**
  - A: remove stale reference(s)
  - B: remap to existing target(s)
  - C: defer unresolved as block

## 7. Preferred Decision per Case

### Preferred domain decisions

- **`memory`**: **normalize into existing domain(s)**
- **`learning`**: **normalize into existing domain(s)**
- **`optimization`**: **normalize into existing domain(s)**

### Preferred broken-reference decisions

- **`sol-api-01`**: **defer unresolved**
- **`err-ui-02`**: **defer unresolved**
- **`sol-dev-004`**: **remove stale reference**
- **`meta-008`**: **defer unresolved**
- **`sol-trading-002`**: **remove stale reference**
- **`sol-cross-047..052`**: **defer unresolved as block**

## 8. Rationale

The preferred decisions follow three principles:

1. **Do not inflate top-level taxonomy without clear reuse.**
   - `memory`, `learning`, and `optimization` currently look more like conceptual descriptors than mature domain families.

2. **Treat `fixes` links more conservatively than `related` links.**
   - unresolved `fixes` targets likely encode stronger author intent and should not be removed casually.

3. **Handle coherent missing blocks as blocks, not as isolated typos.**
   - the `sol-cross-047..052` gap is structurally different from single missing optional relations.

## 9. Safe Follow-Up Actions

If a 0.2E pass is approved, the safest likely follow-up set is:

- normalize `memory`, `learning`, and `optimization` into approved existing domains rather than adding new domain entries
- remove the isolated optional `related` references to:
  - `sol-dev-004`
  - `sol-trading-002`
- keep unresolved and documented for now:
  - `sol-api-01`
  - `err-ui-02`
  - `meta-008`
  - `sol-cross-047..052`
- do not touch `theme:*` beyond documenting a future taxonomy policy pass

## 10. Phase-1 Readiness Judgment

Judgment: **Phase 1 should still not start immediately after 0.2D.**

Reasoning:
- 0.2D only clarifies decisions; it does not execute them
- several unresolved semantic debts would still remain after the decision pass unless a 0.2E fix subset is applied
- the validator is still materially red, especially because of the open `theme:*` backlog

Conditional path to Phase 1:
- a small 0.2E pass could become reasonable if it stays tightly limited to the preferred low-risk manual decisions above
- after 0.2E, Phase 1 could be reconsidered only if the remaining debt is explicitly accepted as known non-blocking debt rather than accidental unresolved drift
