# ARCHITECTURE_MVP

Stand: 2026-03-07
Status: MVP architecture draft based on locked module map
Base reference: `MODULE_MAP_LOCKED.md`

## 1. Purpose and Boundaries

This document defines the MVP architecture of AICOS strictly on the basis of the locked shared module map `M01–M17`.

Its purpose is to describe:
- the MVP target at module level
- the minimum set of locked modules required to build it
- the data boundaries between registry, runtime, audit, and benchmark concerns
- the operating rules for read/write behavior in the MVP

This document does not redefine modules.
This document does not add modules.
This document does not change responsibilities locked in `MODULE_MAP_LOCKED.md`.

The following constraints remain binding:
- Shared Map stays `M01–M17`
- Registry remains Source of Truth
- Runtime, Trace/Audit, and Benchmarks stay separate from Registry files
- proposal-only is the default mode
- validated status requires `proof_ref` plus gates
- no auto-apply in the MVP

## 2. MVP Goal

The MVP goal is to extend the current registry into a controlled, auditable application layer without replacing the registry itself.

The MVP should make it possible to:
- read and navigate the registry through locked registry modules
- run a minimal controlled arena process through locked runtime modules
- capture structured runtime results separately from registry files
- keep model choice, traceability, and later curation under explicit module boundaries

In MVP terms, the system should become:
- readable through `M01–M04`
- operable through `M05–M07`, `M12–M15`
- auditable through `M16`
- explicitly limited regarding `M08–M11` and `M17`

## 3. Non-Goals

The MVP does not aim to:
- replace `M01` Registry Core with a database-backed truth source
- collapse multiple modules into one implementation bucket
- make `M14` or `M15` define policy that belongs elsewhere
- let runtime components write directly into registry files
- introduce open-ended autonomous apply behavior
- treat conceptual traces as validated knowledge without gates
- fully realize `M08` Specialist Roles in depth
- fully realize `M09` Distillation & Judge depth
- build full `M10` memory operations
- build full `M11` NumDSL stack
- enable `M17` curator writes as automatic behavior

## 4. Locked Module Usage (`M01–M17`)

- **`M01 – Registry Core`**
  - canonical source of cards and base knowledge objects
  - remains file-based and authoritative

- **`M02 – Taxonomy & Alias Layer`**
  - controls vocabulary, aliases, and reference stability
  - remains the reference layer for naming and link resolution

- **`M03 – Validation & Generation`**
  - validates registry artifacts and generates derived registry outputs
  - remains separate from runtime decision-making

- **`M04 – Query / Search / Browse Layer`**
  - provides read-oriented access patterns over registry and derived artifacts
  - is the MVP access layer for browse/search behavior

- **`M05 – Packet Schema Layer`**
  - defines the normalized runtime data contracts
  - is required before the runtime can be treated as structured and auditable

- **`M06 – Scout Layer`**
  - provides low-cost early exploration and hypothesis signals
  - is included only at minimal MVP depth

- **`M07 – Observer Kernel`**
  - provides deterministic evaluation and escalation control
  - is the core runtime control module in the MVP

- **`M08 – Specialist Role Layer`**
  - remains deferred except where future triggers require explicit module placeholders
  - is not part of the minimum interactive MVP core

- **`M09 – Distillation & Judge Layer`**
  - remains limited in MVP scope
  - does not become a broad autonomous decision center in v0.1

- **`M10 – Memory System`**
  - remains outside the main MVP execution path
  - may receive proposal-oriented outputs later, but not uncontrolled writes

- **`M11 – NumDSL Stack`**
  - remains later scope
  - does not become a prerequisite for first MVP operation

- **`M12 – Shared Evidence Fetcher`**
  - provides shared evidence context for runtime analysis
  - avoids duplicated evidence gathering across runtime participants

- **`M13 – Model Provider Matrix`**
  - governs model binding, cost awareness, and model-side control boundaries
  - remains separate from registry knowledge and UI ownership

- **`M14 – Web UI Shell`**
  - provides user-facing interaction surfaces
  - does not absorb runtime or policy responsibilities

- **`M15 – API / Runtime Layer`**
  - coordinates module interaction across registry access, runtime execution, and result handling
  - does not override the source-of-truth role of `M01`

- **`M16 – Trace / Audit Layer`**
  - records structured traceability and auditability
  - is mandatory for controlled MVP operation

- **`M17 – Curator / Admin Operations`**
  - remains later scope for curated proposals and maintenance operations
  - does not operate as an automatic write-back channel in the MVP

## 5. Minimal Build Set for MVP

The minimal build set for the MVP is:
- **Core registry base:** `M01`, `M02`, `M03`
- **Registry access layer:** `M04`
- **Minimal arena foundation:** `M05`, `M06`, `M07`
- **Shared evidence and model control:** `M12`, `M13`
- **Application layer:** `M14`, `M15`
- **Mandatory auditability:** `M16`

The following modules are explicitly deferred from core MVP depth:
- `M08`
- `M09`
- `M10`
- `M11`
- `M17`

These deferred modules may influence later scope, but they do not define the first MVP acceptance line.

## 6. Data Boundaries

### Registry files

Registry files belong to:
- `M01`
- `M02`
- `M03`

They include:
- cards and base registry objects
- taxonomy and alias artifacts
- generated registry artifacts derived from registry validation/generation

Registry files remain the only Source of Truth for registry knowledge.
They are not used as a sink for runtime state.

### Runtime state

Runtime state belongs primarily to:
- `M05`
- `M06`
- `M07`
- `M12`
- `M13`
- `M15`

Runtime state is operational and temporary or session-bound.
It must stay outside registry files.
It exists to support controlled execution, not to rewrite registry truth.

### Trace/Audit

Trace and audit data belong to:
- `M16`
- with upstream dependency on `M05`, `M07`, `M13`, and `M15`

Trace/Audit data records what happened, why it happened, and under which controlled conditions it happened.
It must remain structurally separate from registry files.
It may reference registry objects, but does not redefine them.

### Benchmarks

Benchmark-related data belongs primarily to:
- `M13`
- `M16`
- and later `M10` / `M17` when explicitly promoted into later scope

Benchmark data is not registry truth.
Benchmark data is not runtime state in the narrow sense.
Benchmark data is comparative control data and must be stored separately from cards and generated registry artifacts.

## 7. Read/Write Rules

- **`M01–M04` are read-first in MVP use**
  - the registry is read, resolved, validated, and browsed
  - it is not silently rewritten by runtime behavior

- **`M15` may coordinate reads across modules, but not bypass boundaries**
  - `M15` may consume registry data
  - `M15` may produce runtime and audit outputs
  - `M15` may not redefine registry truth on its own

- **`M16` writes audit artifacts, not registry facts**
  - traceability is recorded separately
  - audit data never upgrades itself into validated registry knowledge

- **`M13` writes control data, not content truth**
  - model-side decisions and comparative signals stay outside the registry core

- **proposal-only remains default**
  - all architecture-relevant, curation-relevant, or registry-relevant outcomes default to proposal-only unless an explicit later process says otherwise

- **validated requires proof and gates**
  - no outcome should be treated as validated in MVP without `proof_ref` and gates

- **no auto-apply in MVP**
  - no module may silently apply registry-facing changes in the MVP

## 8. Minimal Runtime Flow

The MVP runtime flow is defined only at module level:

- `M01–M03` provide the stable registry and its validated derived artifacts
- `M04` exposes read-oriented access to those artifacts
- `M12` provides shared evidence context where runtime analysis needs common grounding
- `M05` gives the runtime a normalized structured contract layer
- `M06` produces early exploration and signal formation
- `M07` evaluates and controls escalation using deterministic runtime judgment boundaries
- `M13` governs model-side assignment and control constraints
- `M15` coordinates the runtime path across the locked modules
- `M16` records structured trace and audit outputs from the runtime path

In MVP terms, the runtime flow is therefore:
- registry-grounded
- evidence-aware
- packet-disciplined
- observer-controlled
- model-governed
- audit-recorded
- proposal-only by default

This section deliberately does not define packet details, route details, or interface details beyond module boundaries.

## 9. Risk Controls

The MVP architecture adopts the following risk controls:

- **Registry protection**
  - `M01` remains protected from direct runtime mutation

- **Boundary enforcement**
  - no module absorbs the role of a neighboring module without explicit architectural change control

- **Proposal-only default**
  - runtime outcomes remain recommendations unless later proof and gate requirements are met

- **Validation discipline**
  - registry-facing truth claims must pass through the discipline implied by `M03`, not through runtime convenience

- **Auditability by design**
  - `M16` is not optional in MVP operation where runtime decisions matter

- **Model control separation**
  - `M13` handles model-governance concerns without turning model behavior into registry truth

- **Deferred complexity**
  - `M08`, `M09`, `M10`, `M11`, and `M17` remain intentionally constrained to prevent early overreach

- **No silent promotion**
  - nothing becomes validated, curated, or canonical merely because it exists in runtime state or audit traces

## 10. MVP Acceptance Criteria

The MVP architecture is acceptable when all of the following are true:

- the architecture still cleanly references only the locked shared modules `M01–M17`
- the registry remains the Source of Truth through `M01`
- `M02` and `M03` continue to support stable references and validated derived artifacts
- `M04` is treated as the read-oriented access boundary for registry interaction
- the minimal runtime is bounded by `M05`, `M06`, `M07`, `M12`, `M13`, and `M15`
- `M16` records runtime traceability separately from registry content
- runtime state, trace/audit data, and benchmark data remain separate from registry files
- proposal-only remains the default for non-registry outputs
- validated status is gated by `proof_ref` plus gates
- no auto-apply behavior exists in MVP scope
- no deferred module is smuggled into core MVP responsibility without an explicit architectural change

## 11. Deferred Modules / Later Scope

The following locked modules remain outside the first MVP core scope:

- **`M08 – Specialist Role Layer`**
  - later, when trigger-based expert intervention is justified without destabilizing the minimal runtime

- **`M09 – Distillation & Judge Layer`**
  - later, when deeper synthesis and final judgment quality are needed beyond minimal runtime control

- **`M10 – Memory System`**
  - later, when memory promotion/deprecation can be governed without uncontrolled writes

- **`M11 – NumDSL Stack`**
  - later, when formal rule machinery is needed beyond MVP control simplicity

- **`M17 – Curator / Admin Operations`**
  - later, when maintenance and curation flows can remain proposal-only and explicitly governed

Deferred scope is not undefined scope.
It is locked as later scope until a subsequent architecture step explicitly promotes it without changing the shared map.
