# MVP_PHASE_PLAN

Stand: 2026-03-07
Status: MVP phase plan draft based on frozen architecture references
Base references:
- `MODULE_MAP_LOCKED.md`
- `ARCHITECTURE_MVP.md`
- local freeze commit `7f899cb`

## 1. Planning Purpose

This document defines the phased build plan for the MVP strictly on the basis of the frozen module lock and frozen MVP architecture baseline.

Its purpose is to:
- translate the frozen architecture into a controlled build order
- keep each implementation step aligned to locked modules `M01–M17`
- separate what may be built now from what must remain deferred
- create reviewable delivery slices without slipping into detailed design

This document does not:
- modify `MODULE_MAP_LOCKED.md`
- modify `ARCHITECTURE_MVP.md`
- introduce new modules
- introduce UI page specifications
- introduce API endpoint specifications
- introduce packet details
- define a final monorepo structure

## 2. Phase Ordering Principles

The phases are ordered according to the following principles:

- **Stability before expansion**
  - `M01–M03` must remain stable before additional runtime layers depend on them.

- **Read-first before write-sensitive behavior**
  - the MVP first becomes readable and navigable before controlled runtime behavior is added.

- **Contracts before orchestration**
  - `M05` must exist before runtime modules are treated as structured and auditable.

- **Observation before higher intelligence**
  - `M06` and `M07` are introduced before `M08–M11`.

- **Audit before trust**
  - `M16` must stabilize before runtime behavior is treated as reviewable and dependable.

- **Proposal-only before any stronger promotion logic**
  - no phase may assume automatic validation or auto-apply behavior.

- **Later-scope modules remain later-scope until explicitly promoted**
  - `M08`, `M09`, `M10`, `M11`, and `M17` do not quietly enter core MVP scope.

## 3. Phase 0 – Registry Consistency and Freeze Base

### Modules involved

- `M01`
- `M02`
- `M03`

### What may be built

- consistency checks for the current registry basis
- validation hardening within the existing registry/validation boundaries
- freeze-base verification around the locked docs and registry baseline
- readiness checks to ensure the registry can safely support later read-only access

### Deliverables

- verified registry baseline for `M01–M03`
- confirmed consistency between source registry files and generated artifacts
- documented local freeze base ready for subsequent implementation phases
- reviewable statement that the architecture is building on a stable registry core

### What must not be built yet

- no runtime logic in `M15`
- no UI implementation in `M14`
- no packet detail implementation in `M05`
- no trace system implementation in `M16` beyond readiness framing
- no model-control implementation in `M13`

## 4. Phase 1 – Read-Only Registry Access Foundation

### Modules involved

- `M01`
- `M02`
- `M03`
- `M04`
- `M14` (read-only usage boundary)
- `M15` (minimal coordination only if needed)

### What may be built

- read-only access patterns over registry and derived artifacts
- browse/search/resolution behavior within `M04`
- minimal application coordination required to expose read-only registry access
- read-only presentation behavior that does not add runtime mutation paths

### Deliverables

- a usable read-only registry access foundation aligned with `M04`
- stable taxonomy/alias-aware resolution through `M02`
- validation-backed derived outputs from `M03` feeding read-only use
- a clear separation between registry knowledge and application interaction state

### What must not be built yet

- no arena orchestration beyond read-only coordination
- no runtime write paths back into registry files
- no evidence-fetching runtime behavior from `M12`
- no observer behavior from `M07`
- no trace/audit persistence beyond minimal preparation

## 5. Phase 2 – Minimal Arena Foundation

### Modules involved

- `M05`
- `M06`
- `M07`
- `M12`
- `M15`
- dependent read access through `M01–M04`

### What may be built

- the minimal structured contract basis required for arena operation
- low-cost early exploration behavior within `M06`
- deterministic observation and escalation control within `M07`
- shared evidence context acquisition within `M12`
- runtime coordination in `M15` strictly within frozen boundaries

### Deliverables

- a minimal arena path that is registry-grounded and proposal-only by default
- a controlled transition from registry access to runtime analysis
- an observer-controlled runtime baseline that does not depend on later-scope intelligence layers
- structured runtime outputs suitable for later audit attachment

### What must not be built yet

- no specialist-role depth from `M08`
- no deeper distillation/judge behavior from `M09`
- no memory promotion paths from `M10`
- no NumDSL realization from `M11`
- no curator/admin workflows from `M17`

## 6. Phase 3 – Auditability and Model Control

### Modules involved

- `M13`
- `M16`
- `M15`
- with continued dependence on `M05–M07` and `M12`

### What may be built

- model-control behavior within `M13` at MVP depth
- structured traceability and audit recording within `M16`
- controlled runtime/audit coordination in `M15`
- explicit separation of runtime state, benchmark-related control data, and audit records

### Deliverables

- auditable runtime operation aligned with `M16`
- model-side control boundaries aligned with `M13`
- reviewable separation between registry files, runtime state, trace/audit artifacts, and benchmark-related control artifacts
- a stable MVP control layer that supports review without changing the registry truth model

### What must not be built yet

- no deeper intelligence stack from `M08–M11`
- no curator/admin write flows from `M17`
- no registry mutation path justified by model, audit, or benchmark outputs alone
- no validated promotion without `proof_ref` plus gates

## 7. Phase 4 – Deferred Intelligence Layers

### Modules involved

- `M08`
- `M09`
- `M10`
- `M11`
- `M17`

### What may be built

- only explicitly approved later-scope work after prior phases are stable and reviewed
- specialist-role activation boundaries within `M08`
- deeper synthesis/judge quality within `M09`
- controlled memory proposal logic within `M10`
- limited formal rule machinery within `M11`
- proposal-only curation and maintenance operations within `M17`

### Deliverables

- clearly bounded later-scope extensions that do not alter the frozen shared map
- explicit review gates for each promoted deferred module
- continuation paths for intelligence, memory, and curation without breaking MVP controls

### What must not be built yet

- no automatic registry write-back
- no uncontrolled promotion from runtime or audit into canonical registry truth
- no silent expansion of deferred modules into core scope without formal review

## 8. Entry Criteria per Phase

### Phase 0 entry

- frozen references are available
- registry core exists locally and is reviewable
- no unresolved contradiction between lock and architecture baseline

### Phase 1 entry

- Phase 0 has confirmed the registry consistency baseline
- `M01–M03` are stable enough to support read-only access
- no unresolved ambiguity about registry source-of-truth status

### Phase 2 entry

- Phase 1 has established a usable read-only registry access foundation
- registry access is available without introducing write paths
- the MVP still remains within proposal-only operation

### Phase 3 entry

- Phase 2 has established a minimal arena baseline
- runtime behavior exists in a structured enough form to justify audit and model-control work
- registry/runtime separation remains intact

### Phase 4 entry

- Phase 3 has stabilized auditability and model control
- deferred modules are promoted only by explicit decision
- MVP controls remain intact under review

## 9. Exit Criteria per Phase

### Phase 0 exit

- the registry freeze base is internally consistent enough for downstream use
- the architecture still rests on `M01–M03` without contradiction
- no additional module drift has been introduced

### Phase 1 exit

- read-only registry access exists without creating registry write paths
- `M04` is usable as the read boundary over registry and derived artifacts
- taxonomy and alias stability still depend on `M02`

### Phase 2 exit

- a minimal arena path exists at module level
- the runtime remains proposal-only by default
- no deferred intelligence layer has been pulled into mandatory scope

### Phase 3 exit

- model control and auditability are structurally separated from registry truth
- trace/audit behavior exists without redefining canonical knowledge
- benchmark-related control artifacts remain separate from registry files

### Phase 4 exit

- any promoted deferred module remains explicitly bounded
- later-scope intelligence does not break registry or audit boundaries
- no auto-apply or uncontrolled validation path has been introduced

## 10. Risks per Phase

### Phase 0 risks

- assuming freeze readiness without enough registry consistency review
- carrying forward drift between source and generated registry artifacts
- beginning implementation on top of a moving registry base

### Phase 1 risks

- letting read-only interaction become a disguised runtime layer
- mixing application interaction state with registry truth
- widening `M04` into responsibilities that belong to `M15`

### Phase 2 risks

- treating the minimal arena as a place for early over-complexity
- slipping from module-level control into hidden detail design
- using runtime outputs as if they were already validated knowledge

### Phase 3 risks

- letting `M13` or `M16` justify content truth changes
- collapsing traceability and benchmark control into registry files
- making audit output appear equivalent to validation

### Phase 4 risks

- early overreach of `M08–M11` into core MVP
- memory or curation behaving like an uncontrolled write-back system
- turning deferred intelligence into architecture drift

## 11. Explicit Non-Goals per Phase

### Phase 0 non-goals

- no product-facing runtime
- no UI detail design
- no packet detail design

### Phase 1 non-goals

- no full runtime behavior
- no model-control depth
- no trace/audit implementation as operational truth layer

### Phase 2 non-goals

- no deeper specialist-role stack
- no full distillation/judge expansion
- no memory/NumDSL rollout

### Phase 3 non-goals

- no automatic promotion from traces or benchmarks
- no registry write-backs through runtime control logic
- no replacement of the registry truth model

### Phase 4 non-goals

- no silent shift of deferred modules into mandatory MVP core
- no auto-apply
- no validated status without `proof_ref` plus gates

## 12. Suggested Review Gate after Each Phase

### After Phase 0

- confirm registry consistency and freeze-base stability
- confirm continued lock compliance

### After Phase 1

- confirm read-only boundaries remain intact
- confirm no runtime write paths have been introduced

### After Phase 2

- confirm minimal arena scope is still minimal
- confirm proposal-only remains the default operating mode

### After Phase 3

- confirm trace/audit and model-control remain separate from registry truth
- confirm runtime, trace, and benchmark boundaries are still intact

### After Phase 4

- confirm each deferred module was promoted explicitly
- confirm no architecture drift occurred relative to the frozen lock and architecture baseline
