# Maya Spec Phase 1A - Implementation Notes

## Naming Convention

### Spec vs Implementation

| Spec Name | Implementation Table | Notes |
|-----------|---------------------|-------|
| `maya_store` | `maya_memory` | Spec-level concept for tiered memory store |
| `maya_messages` | `maya_messages` | Direct match |
| `maya_audit` | `maya_audit` | Direct match |
| `maya_app_context` | `maya_app_context` | Direct match |

### Authority

- `maya_memory` is the **authoritative implementation table** for the spec concept `maya_store`
- All API routes under `/api/maya/memory` operate on `maya_memory`
- Documentation should use `maya_store` as the conceptual name, `maya_memory` as the implementation detail

### Legacy Table

- `maya_state` (JSONB payload) remains for backward compatibility with existing Maya-Core features
- `maya_memory` is the new structured memory plane per Spec Phase 1A
- No migration from `maya_state` to `maya_memory` required in Phase 1A

## Additional Tables

- `maya_cost_daily` — Aggregate cache for cost tracking, derived from `maya_messages.cost_cents`
- Not part of Spec core, but consistent with Spec intent

## Contract Summary

```
Spec Concept     → Implementation
─────────────────────────────────────
maya_store       → maya_memory (table)
maya_messages    → maya_messages (table)
maya_audit       → maya_audit (table)
maya_app_context → maya_app_context (table)
```
