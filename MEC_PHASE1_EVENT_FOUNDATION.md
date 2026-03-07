# MEC_PHASE1_EVENT_FOUNDATION
## AICOS Meta-Efficiency Core — Phase 1 Event Foundation Surface
**Status:** implemented Phase 1 surface  
**Scope:** runtime-only MEC event layer outside the registry  
**Rule:** events are not canon, not registry cards, and do not auto-create candidates or canon artifacts.

---

## 0. Purpose

Phase 1 adds the smallest useful MEC event foundation that fits the locked sidecar architecture.

It establishes:
- runtime event storage under `runtime/events/`
- a minimal event schema
- local create/list/get flows
- minimal CLI support
- minimal HTTP create/read support in the existing arena server pattern
- a dedicated Phase 1 verifier

It does not establish:
- candidate distillation
- MEC review for candidates
- judgment/tradeoff/policy logic
- export gate logic
- canon mutation

---

## 1. Runtime boundary

Default storage:
- events: `runtime/events/`

Registry remains unchanged:
- `cards/`
- `index/`
- `human/`
- `taxonomies/`

Events are runtime-only artifacts.
They must not be treated as canon or registry cards.

---

## 2. Minimal event model

Each stored event carries:
- `id`
- `event_type`
- `domain`
- `summary`
- `source_ref`
- `trace_ref`
- `confidence`
- `privacy_class`
- `ttl_days`
- `priority_score`
- `salience_signals`
- `status`
- `created_at`
- `expires_at`

The implementation also records an explicit event boundary block showing:
- runtime-only state
- no registry mutation
- no candidate creation
- no canon export
- minimal priority threshold reference

---

## 3. Minimal runtime behavior

Phase 1 provides a small event runtime library with:
- `createEvent`
- `listEvents`
- `getEvent`

Minimum behavior:
- validates required event fields
- stores each event as one JSON file
- computes `expires_at` from `created_at + ttl_days`
- clamps `priority_score` to `0..1`
- keeps events outside registry paths

This phase does not transform events into any candidate or canon artifact.

---

## 4. CLI surface

```bash
node tools/arena.js create-event --event-type TYPE --domain DOMAIN --summary TEXT --source-ref REF --trace-ref REF [--confidence LEVEL] [--privacy-class CLASS] [--ttl-days DAYS] [--priority-score VALUE] [--salience SIGNAL] [--event-status STATUS] [--event-dir DIR] [--json]
node tools/arena.js list-events [--event-dir DIR] [--json]
node tools/arena.js get-event <event_id> [--event-dir DIR] [--json]
```

Supported behavior:
- create a runtime-only MEC event
- list stored MEC events
- read a stored MEC event by ID

---

## 5. HTTP surface

Available endpoints:
- `GET /arena/events`
- `POST /arena/events`
- `GET /arena/events/:id`

Behavior:
- uses local runtime storage only
- writes only to `runtime/events/` or an explicitly supplied event runtime dir
- performs no registry mutation
- performs no candidate or canon generation

---

## 6. Verification

Verifier command:

```bash
node tools/verify-mec-phase1-events.js
```

Verification checks:
- required Phase 1 files exist
- runtime events are written only under `runtime/events/`
- create/list/get work locally
- TTL and base fields are present
- CLI surface works locally
- HTTP create/read surface works locally
- registry files remain unchanged
- no candidate or canon logic is introduced by the Phase 1 runtime path
