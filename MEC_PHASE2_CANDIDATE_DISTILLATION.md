# MEC_PHASE2_CANDIDATE_DISTILLATION

Stand: 2026-03-08
Status: MEC Phase 2 candidate distillation MVP surface

## 1. Purpose

Phase 2 adds the smallest useful runtime candidate layer on top of the existing MEC event foundation.

It provides a runtime-only candidate forge for:
- `invariant_candidate`
- `boundary_candidate`
- `counterexample_candidate`
- `curiosity_candidate`

This phase does not add review, export, canon mutation, or promotion logic.

## 2. Runtime boundary

Default storage:
- events: `runtime/events/`
- candidates: `runtime/candidates/`

Registry remains unchanged:
- `cards/`
- `index/`
- `human/`
- `taxonomies/`

MEC candidates are runtime-only artifacts.
They are not canon and they are not registry cards.

## 3. Minimal candidate model

Every stored MEC candidate exposes at least:
- `id`
- `candidate_type`
- `principle`
- `mechanism`
- `source_event_ids`
- `source_card_ids`
- `status`
- `created_at`
- `updated_at`

Type-specific additions:

### invariant_candidate
- `scope`
- `locality`
- `applies_when`
- `metrics`
- `proof_state`
- `proof_ref`
- `gate_state`
- `linked_boundary_candidate_id`
- `boundary_outline`

### boundary_candidate
- `linked_candidate_id`
- `fails_when`
- `edge_cases`
- `severity`

### counterexample_candidate
- `refutes_candidate_id`
- `case_description`
- `resolution`
- `impact_on_candidate`

### curiosity_candidate
- `open_question`
- `domain`
- `blind_spot_score`

All Phase 2 candidates remain proposal-only runtime artifacts.

## 4. Distillation stance

Phase 2 intentionally keeps distillation conservative.

The current implementation supports:
- manual candidate creation
- semi-manual candidate creation with explicit source links
- automatic linked boundary creation when creating an `invariant_candidate`

This is enough for the MVP foundation because the locked MEC plan allows a small manual or semi-manual distillation basis in Phase 2.

## 5. Source linking

Candidate creation may link to:
- MEC events via `source_event_ids`
- existing registry cards via `source_card_ids`

Validation behavior:
- referenced MEC events must exist in the local event runtime path
- referenced registry cards must exist in the read-only registry surface
- linked runtime candidate refs for boundary and counterexample candidates must exist

## 6. CLI surface

```bash
node tools/arena.js create-mec-candidate --candidate-type TYPE [--principle TEXT] [--mechanism TEXT] [--source-event-id ID] [--source-card-id ID] [--scope SCOPE] [--locality LOCALITY] [--applies-when TEXT] [--proof-ref REF] [--proof-state STATE] [--gate-state STATE] [--distillation-mode MODE] [--linked-candidate-id ID] [--refutes-candidate-id ID] [--open-question TEXT] [--domain DOMAIN] [--case-description TEXT] [--resolution TEXT] [--impact-on-candidate TEXT] [--blind-spot-score VALUE] [--severity LEVEL] [--boundary-fails-when TEXT] [--boundary-edge-case TEXT] [--candidate-status STATUS] [--candidate-dir DIR] [--event-dir DIR] [--json]
node tools/arena.js list-mec-candidates [--candidate-dir DIR] [--json]
node tools/arena.js get-mec-candidate <candidate_id> [--candidate-dir DIR] [--json]
```

## 7. HTTP surface

Available endpoints:
- `GET /arena/mec-candidates`
- `POST /arena/mec-candidates`
- `GET /arena/mec-candidates/:id`

Behavior:
- reads and writes only the local MEC candidate runtime directory
- validates event and card refs locally
- performs no registry mutation
- performs no review or export action

## 8. Invariant and boundary rule

Phase 2 requires a linked boundary structure for invariants.

Current behavior:
- creating an `invariant_candidate` also creates a linked `boundary_candidate`
- the invariant stores `linked_boundary_candidate_id`
- the linked boundary stores `linked_candidate_id`

This keeps the runtime candidate structure explicit without introducing Phase 3 review or later export semantics.

## 9. Verification

Verifier command:

```bash
node tools/verify-mec-phase2-candidates.js
```

Verification checks:
- MEC Phase 1 remains green
- AICOS Phase 4A through 4D remain green
- candidate artifacts are written only under `runtime/candidates/`
- invariant creation creates a linked boundary candidate
- counterexample and curiosity candidates can be created and read back
- CLI create/list/get works
- HTTP create/list/get works
- no registry files are changed
- no canon or export logic is introduced
