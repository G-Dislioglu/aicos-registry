# MEC_ARCHITECTURE_LOCKED
## AICOS Meta-Efficiency Core — Locked Architecture
**Status:** locked architectural reference  
**Scope:** sidecar subsystem for AICOS  
**Rule:** runtime artifacts remain outside registry; registry remains source of truth for canon only.

---

## 0. Architectural purpose

MEC exists to convert runtime evidence into higher-quality knowledge with minimal drift.

Primary goals:
- collect evidenzfähige runtime events
- distill candidate knowledge
- attack candidate knowledge before trust increases
- preserve review/audit trails
- derive judgments under explicit constraints
- export only a small, gated subset into canon

Primary non-goals:
- not a chat memory dump
- not a direct registry rewrite
- not cross-app person-memory in first build
- not automatic canon growth
- not full autonomous governance

---

## 1. Hard design laws

### LAW-01 — Canon is small
Canon stores only durable, reviewed, export-approved artifacts.

### LAW-02 — Runtime is outside canon
Events, candidates, reviews, variants and temporary judgments stay outside:
- `cards/` 
- `index/` 
- `human/` 
- `taxonomies/` 

### LAW-03 — Proposal-only by default
New artifacts are proposal-only unless explicitly reviewed and gated.

### LAW-04 — No silent promotion
No timer, no hidden mutation, no inferred canon write.

### LAW-05 — No canon mutation without export gate
Only the export gate may create or mutate canon artifacts.

### LAW-06 — Every strong rule must face challenge
No invariant without:
- boundary
- contradiction pressure
- explicit scope

### LAW-07 — Review and export are different
Runtime acceptance is not canon acceptance.

### LAW-08 — Context is scarce
Agent context should use short derived briefs, not raw dumps.

---

## 2. Zone model

MEC uses five zones.

### Z1 — Event Zone
Purpose:
- collect short-lived, evidenzfähige runtime events

Artifacts:
- `event` 

Characteristics:
- TTL-bound
- trace-linked
- not canon
- not directly injected as long prompt context

### Z2 — Candidate Zone
Purpose:
- hold proposal-only knowledge candidates

Artifacts:
- `invariant_candidate` 
- `boundary_candidate` 
- `counterexample_candidate` 
- `causal_candidate` 
- `curiosity_candidate` 

Characteristics:
- evidence-linked
- proposal-only
- revisable

### Z3 — Review Zone
Purpose:
- preserve review actions and reconsolidation outcomes

Artifacts:
- `review_record` 

Characteristics:
- explicit decision trail
- no canon write by itself
- can reopen or weaken candidates

### Z4 — Judgment Zone
Purpose:
- derive situational operational decisions from reviewed knowledge

Artifacts:
- `judgment_candidate` 
- `tradeoff_candidate` 
- `policy_candidate` 

Characteristics:
- constraint-sensitive
- not equal to invariant knowledge
- requires stronger gating

### Z5 — Canon Zone
Purpose:
- store very small, durable, export-approved knowledge

Artifacts:
- `invariant` 
- `judgment` 
- `tradeoff` 
- `policy` 

Characteristics:
- audit-linked
- explicit scope
- periodically revalidated

---

## 3. Flow model

MEC does not use a naive linear chain.
It uses a gated directed graph.

Allowed paths:

- `event -> candidate` 
- `candidate -> review` 
- `review -> candidate` 
- `review -> judgment` 
- `review -> canon` 
- `judgment -> review` 
- `canon -> review` 

Disallowed paths:

- `event -> canon` 
- `event -> judgment` 
- `candidate -> canon` without review/export
- `candidate -> policy` without review
- `variant -> canon` 

Implication:
- reconsolidation is normal
- reopening is normal
- canon is not the next automatic step

---

## 4. Runtime storage layout

```text
/runtime/events/
/runtime/candidates/
/runtime/reviews/
/runtime/judgments/
/runtime/variants/
/runtime/health/
/runtime/context-briefs/
/runtime/audit/
```

Registry remains unchanged in principle:

```text
/cards/
/index/
/human/
/taxonomies/
```

---

## 5. Core modules

### MEC-01 Event Intake

Responsibilities:

* accept only evidenzfähige raw inputs
* reject full undifferentiated chat dumps
* apply priority/salience threshold
* assign TTL and privacy class

Outputs:

* `event` 

### MEC-02 Evidence Ledger

Responsibilities:

* store source_ref, trace_ref, confidence, privacy, TTL
* maintain proof hooks
* support review and export auditability

Outputs:

* ledger-linked `event` references

### MEC-03 Candidate Forge

Responsibilities:

* distill candidate principles from repeated evidence
* produce candidate artifacts
* attach source refs and initial metrics

Outputs:

* `invariant_candidate` 
* optional `causal_candidate` 
* derived `boundary_candidate` 
* `curiosity_candidate` 

### MEC-04 Challenge Engine

Responsibilities:

* seek contradictions
* test boundaries
* detect false universality
* compute contradiction pressure

Outputs:

* `counterexample_candidate` 
* updated candidate metrics
* review flags

### MEC-05 Transfer Lab

Responsibilities:

* test portability across domains
* classify candidate scope:

  * local
  * portable_with_constraints
  * portable

Outputs:

* transfer result
* updated scope / locality fields

### MEC-06 Reconsolidation Queue

Responsibilities:

* hold reviewed candidates in a controlled revision window
* allow:

  * stabilize
  * weaken
  * split
  * reject
  * reopen

Outputs:

* updated runtime status
* review-linked transitions

### MEC-07 Judgment Forge

Responsibilities:

* create constraint-sensitive operational judgments
* combine:

  * stable knowledge
  * tradeoffs
  * risk/cost/reversibility context

Outputs:

* `judgment_candidate` 
* `tradeoff_candidate` 
* `policy_candidate` 

### MEC-08 Canon Export Gate

Responsibilities:

* the only path into canon
* verify proof and gate conditions
* assign export record
* protect registry discipline

Outputs:

* canon artifacts only

### MEC-09 Homeostatic Controller

Responsibilities:

* protect rare but critical knowledge
* dampen shallow dominance
* flag prune/revive/watch conditions

Outputs:

* health flags only
* no automatic deletion

### MEC-10 Variant Lab

Responsibilities:

* shadow-only exploration of alternative rule forms

Outputs:

* `variant_candidate` 

### MEC-11 Observer Kernel

Responsibilities:

* deterministic merge
* gate checking
* state integrity
* consistency between candidate, review and export layers

Outputs:

* state proposals, not autonomous canon writes

### MEC-12 Context Distiller

Responsibilities:

* create short task-specific context briefs
* reduce prompt bloat
* prioritize useful derived knowledge over raw history

Outputs:

* `context_brief` 

---

## 6. Artifact definitions

### 6.1 Runtime-only artifacts

#### event

Short-lived runtime evidence object.

Minimum fields:

* `id` 
* `event_type` 
* `domain` 
* `summary` 
* `source_ref` 
* `trace_ref` 
* `confidence` 
* `privacy_class` 
* `ttl_days` 
* `priority_score` 
* `salience_signals[]` 
* `status` 
* `created_at` 
* `expires_at` 

#### invariant_candidate

Candidate principle distilled from repeated evidence.

Minimum fields:

* `id` 
* `principle` 
* `mechanism` 
* `scope` 
* `locality` 
* `applies_when[]` 
* `source_event_ids[]` 
* `source_card_ids[]` 
* `metrics` 
* `proof_state` 
* `proof_ref[]` 
* `gate_state` 
* `status` 
* `created_at` 
* `updated_at` 

#### boundary_candidate

Explicit failure boundary for an invariant candidate.

Minimum fields:

* `id` 
* `linked_candidate_id` 
* `fails_when[]` 
* `edge_cases[]` 
* `severity` 
* `status` 

#### counterexample_candidate

Contradicting case against a candidate principle.

Minimum fields:

* `id` 
* `refutes_candidate_id` 
* `case_description` 
* `resolution` 
* `impact_on_candidate` 
* `status` 

#### causal_candidate

Optional mechanistic or causal hypothesis tied to candidate reasoning.

Minimum fields:

* `id` 
* `hypothesis` 
* `cause_candidate` 
* `evidence_for[]` 
* `evidence_against[]` 
* `confidence` 
* `boundary_conditions[]` 
* `status` 

#### curiosity_candidate

Structured open question or blind-spot artifact.

Minimum fields:

* `id` 
* `open_question` 
* `domain` 
* `blind_spot_score` 
* `created_by` 
* `status` 
* `created_at` 

Rule:

* never auto-resolve

#### review_record

Review artifact for candidate/judgment progression.

Minimum fields:

* `id` 
* `reviewed_item_id` 
* `decision` 
* `rationale` 
* `evidence_used[]` 
* `operator_scores` 
* `reviewed_by` 
* `reviewed_at` 
* `registry_mutation` 
* `promotion_executed` 

Allowed decisions:

* `stabilize` 
* `split` 
* `weaken` 
* `reject` 
* `keep_local` 
* `reopen` 
* `needs_more_evidence` 
* `ready_for_export` 

### 6.2 Canon-only artifacts

#### invariant

Export-approved, durable principle.

#### judgment

Constraint-aware decision rule.

#### tradeoff

Structured gain/cost/irreversibility object.

#### policy

Operational durable rule with explicit scope and exceptions.

All canon artifacts must carry:

* `proof_ref[]` 
* `source_candidate_ids[]` 
* `export_record` 
* `last_revalidated_at` 
* `status` 

---

## 7. Status model

### Event

* `active` 
* `consolidated` 
* `expired` 
* `pruned` 

### Candidate

* `proposal_only` 
* `challenged` 
* `needs_more_evidence` 
* `local_only` 
* `reconsolidation_pending` 
* `runtime_accepted` 
* `runtime_rejected` 
* `superseded` 

### Judgment candidate

* `proposal_only` 
* `review_due` 
* `runtime_accepted` 
* `runtime_rejected` 

### Canon

* `active` 
* `deprecated` 
* `under_revalidation` 

Rule:

* review is an action recorded in review records
* review is not itself a stable truth state

---

## 8. Operators

### OP-01 DISTILL

Purpose:

* derive candidate principles from repeated evidence

Input:

* multiple events and/or related canon artifacts

Output:

* `invariant_candidate` 
* optional `causal_candidate` 

Constraints:

* no unsupported generalization
* mechanism required

### OP-02 BOUND

Purpose:

* derive explicit limits for a candidate principle

Input:

* `invariant_candidate` 

Output:

* `boundary_candidate` 

Constraints:

* at least 2 failure conditions
* at least 1 edge case

### OP-03 CHALLENGE

Purpose:

* attack a candidate using contradiction search

Input:

* candidate
* related failures
* related counterexamples
* optionally adversarial model-based probes

Output:

* contradiction pressure
* `counterexample_candidate` 
* candidate status proposal

Rule:

* use mixed grading where possible:

  * code-based
  * model-based
  * human

### OP-04 TRANSFER

Purpose:

* test cross-domain portability

Output categories:

* `portable` 
* `portable_with_constraints` 
* `local_only` 
* `mock_warning` 

### OP-05 RECONSOLIDATE

Purpose:

* revise candidate after review or new evidence

Possible outcomes:

* stabilize
* split
* weaken
* reject
* reopen

Rule:

* no timer-based canon shift

### OP-06 ADJUDICATE

Purpose:

* derive situational judgment from stable knowledge and tradeoffs

Inputs:

* stable candidates
* known tradeoffs
* explicit constraints

Output:

* `judgment_candidate` 

### OP-07 EXPORT

Purpose:

* sole mechanism for canon creation/mutation

Rule:

* no other operator may mutate canon

---

## 9. Metrics

Each candidate may carry:

* `compression_gain` 
* `boundary_sharpness` 
* `counterexample_pressure` 
* `transfer_score` 
* `decision_uplift` 
* `epistemic_cost` 

Each metric should additionally carry or derive:

* `grade_source` = `code | model | human | mixed` 

Purpose:

* make scoring inspectable
* reduce vague model-only judgments

Metrics inform review and export, but do not autonomously override gates.

---

## 10. Homeostatic rules

Health flags may include:

* `protect` 
* `dampen` 
* `watch` 
* `revive` 
* `prune_flag` 
* `stable` 

Rules:

* no automatic deletion
* rare + high rescue => protect
* dominant + shallow => dampen
* stale + low value => prune_flag
* reactivated relevance => revive

---

## 11. Variant Lab rules

Allowed operations:

* `narrow` 
* `expand` 
* `invert` 
* `split` 
* `analogize` 
* `compose` 

Rules:

* only on `runtime_accepted` 
* never directly on canon
* never auto-merge
* always proposal-only
* always auditable
* human-init required for governance-sensitive artifacts

---

## 12. Export gate conditions

Canon export requires all of:

* runtime artifact is eligible
* at least one review record exists
* proof references exist
* boundary exists
* contradiction pressure below threshold
* epistemic cost acceptable
* no blocking mock warning
* explicit export approval
* registry mutation allowed in this flow

Local invariants may be exported only with explicit local scope.

---

## 13. Anti-drift laws

* no proposal-only artifact in registry
* no auto-promote by time
* no mutation on canon outside export gate
* no cross-app person-memory in first MEC build
* no full log dumps as events
* no canon without challenge path
* no judgment without explicit constraints
* no variant auto-merge
* no deletion without human-gated review
* no canon expansion as side effect of read-model logic

---

## 14. Integration stance

### AICOS

Registry remains canon source of truth.

### G-MIND

Good place for candidate generation, transfer tests and review preparation.

### Maya Core / Observer

Good fit for deterministic observer kernel and blackboard orchestration.

### Proof Core

Should own proof/gate evaluation for export readiness.

### GOAT / Nexus-like supervision

Good fit for homeostatic and blind-spot monitoring.

### Artifex-like evaluation

Useful for evaluator/testsuite mindset, not for first MEC MVP scope.

### Hyperion / CAL-style efficiency

Use delta/incremental recomputation, not full recompute whenever possible.

---

## 15. Locked decision

MEC will be built as a **sidecar subsystem**, not as a registry rewrite.

If any future file conflicts with this principle, this file wins until explicitly revised.
