# MEC_MVP_PHASE_PLAN
## AICOS Meta-Efficiency Core — MVP Build Plan
**Status:** implementation plan  
**Principle:** build MEC as sidecar, not as registry rewrite.

---

## 0. Build philosophy

MEC must be introduced in the smallest sequence that preserves:
- registry cleanliness
- runtime/canon separation
- auditability
- low drift
- real testability

The MVP must not attempt the full final architecture at once.

---

## 1. Current baseline

Assumed AICOS state:
- Registry remains source of truth for canon
- runtime memory candidates already exist outside registry
- runtime memory reviews already exist outside registry
- review status is derived in read-models, not by mutating candidate files
- no real promotion pipeline exists yet

Implication:
- MEC must build **on top of** this runtime-first path
- MEC must not replace it abruptly

---

## 2. MVP success definition

MEC MVP is successful if it can do all of the following outside the registry:

1. record evidenzfähige events
2. derive invariant candidates from grouped events/cards
3. derive explicit boundaries
4. record reviews against these candidates
5. keep all proposal artifacts runtime-only
6. avoid silent canon mutation
7. support later explicit export without already implementing full canon automation

---

## 3. MVP scope

### In scope
- runtime events
- runtime candidates
- runtime reviews
- minimal distill logic
- minimal boundary logic
- minimal challenge logic
- anti-drift constraints
- short architecture docs

### Out of scope
- full judgment forge
- policy canon
- full variant lab
- full homeostatic controller
- automatic cross-domain transfer expansion
- direct registry schema rewrite
- cross-app person memory
- auto-promotion

---

## 4. MVP artifact set

### Runtime artifacts in MVP
- `event` 
- `invariant_candidate` 
- `boundary_candidate` 
- `counterexample_candidate` 
- `curiosity_candidate` 
- `review_record` 

### Deferred artifacts
- `causal_candidate` 
- `judgment_candidate` 
- `tradeoff_candidate` 
- `policy_candidate` 
- `variant_candidate` 

---

## 5. MVP storage layout

```text
/runtime/events/
/runtime/candidates/
/runtime/reviews/
```

Optional later:

```text
/runtime/judgments/
/runtime/variants/
/runtime/health/
/runtime/context-briefs/
/runtime/audit/
```

No new canon folders required for first MEC MVP.

---

## 6. MVP phases

## Phase 0 — Documentation Lock

### Goal

Create architectural lock documents before implementation drift starts.

### Deliverables

* `MEC_RAW_MASS_ARCHIVE.md` 
* `MEC_ARCHITECTURE_LOCKED.md` 
* `MEC_MVP_PHASE_PLAN.md` 

### Acceptance criteria

* documents exist
* sidecar principle is explicit
* no registry rewrite implied

---

## Phase 1 — Event Foundation

### Goal

Introduce runtime event layer outside registry.

### Build

* define `event` schema
* create `/runtime/events/` 
* create small library for:

  * create event
  * list events
  * get event
* define `priority_score` threshold logic
* define TTL rules

### Acceptance criteria

* events can be created and read
* events remain outside registry
* no canon mutation
* events carry trace/source/confidence/privacy/ttl

### Out of scope

* no large chat-log ingestion
* no emotional profiling
* no export logic

---

## Phase 2 — Candidate Distillation MVP

### Goal

Generate runtime candidate artifacts from repeated evidence.

### Build

* define runtime candidate schemas:

  * `invariant_candidate` 
  * `boundary_candidate` 
  * `counterexample_candidate` 
  * `curiosity_candidate` 
* create `/runtime/candidates/` 
* implement minimal DISTILL
* implement minimal BOUND
* connect source refs to events and existing cards

### Acceptance criteria

* at least 3 manual or semi-automatic invariant candidates can be created
* each invariant candidate has:

  * principle
  * mechanism
  * source refs
  * status
* each invariant candidate has a linked boundary candidate
* all remain proposal-only

### Out of scope

* no full cross-domain transfer engine
* no canon export

---

## Phase 3 — Review Integration

### Goal

Extend review handling from memory reviews toward MEC candidate reviews.

### Build

* define review behavior for MEC candidate types
* reuse or extend runtime review infrastructure
* ensure reviewed status is represented in read-models, not by mutating raw candidate truth in unsafe ways
* allow:

  * stabilize
  * reject
  * needs_more_evidence
  * keep_local
  * reopen

### Acceptance criteria

* candidate review records can be created
* candidate file remains proposal-origin artifact
* derived read-model can show current state
* no registry mutation

### Out of scope

* no full canon pipeline
* no policy/judgment export

---

## Phase 4 — Challenge MVP

### Goal

Add contradiction-first pressure before trust increases.

### Build

* implement minimal CHALLENGE
* search for known contradictions using:

  * linked failures
  * existing error cards
  * prior review outcomes
* produce `counterexample_candidate` where needed
* compute minimal contradiction pressure

### Acceptance criteria

* at least one candidate can be challenged successfully
* contradiction pressure affects review recommendation
* no automatic canon consequences

### Out of scope

* no full multi-model adversarial framework yet

---

## Phase 5 — Curiosity / Blind Spot MVP

### Goal

Preserve open questions without pretending they are knowledge.

### Build

* create `curiosity_candidate` 
* define blind-spot scoring rules
* add simple list/read flows

### Acceptance criteria

* curiosity artifacts are visible
* never auto-resolved
* remain outside registry

---

## Phase 6 — Export Gate Pilot

### Goal

Create the first explicit, gated path toward canon without broad automation.

### Build

* define export-readiness check
* require:

  * review record
  * boundary
  * acceptable contradiction pressure
  * proof refs
  * explicit approval
* implement pilot export for one narrow artifact class only:

  * `invariant_candidate -> invariant` 

### Acceptance criteria

* export can only happen explicitly
* exported canon artifact links back to runtime sources
* no other runtime artifact is auto-exported

### Out of scope

* no mass export
* no auto-export scheduling

---

## 7. Recommended implementation order

Recommended exact order:

1. lock docs
2. event runtime
3. candidate runtime
4. candidate review extension
5. challenge
6. curiosity
7. export gate pilot

Only after that:
8. transfer lab
9. judgment forge
10. variant lab
11. homeostatic controller
12. broader context distiller

---

## 8. Suggested first concrete clusters

Start with a very small number of manually curated distillation clusters.

### Cluster A — Lifecycle Management

Candidate direction:

* browser/resource lifecycle handling
* repeated failure/fix patterns

### Cluster B — Stale State / Refresh Integrity

Candidate direction:

* stale client state
* stale bundle / reload inconsistency
* environment-induced false diagnosis

### Cluster C — Review vs Canon Discipline

Candidate direction:

* runtime accepted is not canon accepted
* review-derived read-models preserve source artifact integrity

These are strong because:

* evidence already exists
* domains are concrete
* mechanisms are discussable
* boundaries are likely discoverable

---

## 9. Anti-drift checklist for every implementation phase

For every MEC phase, verify:

* runtime artifact stays outside registry
* proposal-only stays proposal-only
* no timer-based promotion exists
* no hidden write path to canon exists
* review and export are still separate
* artifact scope is explicit
* no new global taxonomy is forced too early
* no large refactor is justified only by future dreams

---

## 10. Review criteria before moving beyond MVP

Do not move into transfer/judgment/variant expansion unless these are true:

* runtime event layer is stable
* candidate schemas are readable and coherent
* review records are consistent
* challenge logic yields meaningful contradictions
* no registry contamination has appeared
* at least one pilot export can be traced end-to-end

---

## 11. Final instruction to implementers

MEC must remain a disciplined sidecar until proven useful.

The build sequence is intentionally conservative:

* evidence first
* candidates second
* review third
* contradiction before trust
* export last

If implementation pressure pushes toward “just put it in the registry now,” stop and reject that move.
