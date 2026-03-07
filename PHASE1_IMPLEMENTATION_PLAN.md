# PHASE1_IMPLEMENTATION_PLAN

Stand: 2026-03-07
Status: Phase 1 implementation plan

## 1. Purpose

This document defines the minimal implementation scope for Phase 1: a read-only registry access foundation.

The goal is to introduce a usable `M04`-aligned access layer over the existing registry without changing the registry's role as source of truth and without introducing runtime write paths.

## 2. Scope Boundaries

In scope:
- read-only listing over `index/INDEX.json`
- read-only card lookup by ID
- alias-aware ID resolution via `index/ALIASES.json`
- exact-match filtering by `type`, `domain`, `tag`, and `status`
- minimal text search over index-visible fields
- a minimal command-line access surface for local use and verification
- a minimal HTTP read-only access surface using only built-in Node modules

Out of scope:
- writes to `cards/`, `index/`, `human/`, or `taxonomies/`
- UI implementation
- arena runtime
- packet details
- API write operations
- changes to locked architecture/readiness documents

## 3. Existing Repo Basis

Authoritative existing inputs:
- `cards/` as source of truth card storage (`M01`)
- `index/INDEX.json` as generated scan surface (`M03`)
- `index/ALIASES.json` as existing alias layer (`M02`)
- `tools/generate-index.js`, `tools/generate-human-registry.js`, `tools/validate-taxonomy.js` as current Node tooling

Current gap:
- `M04` is conceptually required but has no dedicated read-only query module yet
- there is no minimal runtime-facing read-only access surface yet

## 4. Minimal Phase-1 Build Strategy

To stay inside Phase 1, build only:

1. a reusable read-only library in `tools/registry-readonly-lib.js`
2. a minimal CLI surface in `tools/registry-readonly.js`
3. a minimal HTTP read-only surface in `tools/registry-readonly-server.js`
4. a verification script in `tools/verify-phase1-readonly.js`
5. this implementation plan and a surface description document

This keeps the implementation:
- local
- minimal
- inspectable
- aligned with the repo's existing Node tooling style

## 5. Planned Behavior

### Listing

Support read-only listing from `index/INDEX.json` with optional filters:
- `type`
- `domain`
- `tag`
- `status`
- free-text query over `id`, `token`, and `title`
- optional result limit

### Lookup

Support full-card lookup by ID:
- direct canonical ID lookup
- alias-aware lookup when the requested ID is present in `index/ALIASES.json`
- canonical file resolution from card type into `cards/errors`, `cards/solutions`, or `cards/meta`

### Resolution

Support explicit ID resolution reporting:
- requested ID
- canonical resolved ID
- whether alias resolution happened
- whether the canonical card exists in the current index

### HTTP Access Surface

Support a minimal HTTP read-only surface with built-in Node modules only:
- `GET /health`
- `GET /stats`
- `GET /cards`
- `GET /cards/:id`
- `GET /resolve/:id`

The surface must stay read-only and reject non-`GET` methods.

### Verification

Check that the new Phase 1 surface:
- performs read-only operations only
- avoids write APIs in the new Phase 1 scripts
- resolves at least one known alias correctly
- can list and read cards successfully
- can serve the minimal HTTP read-only endpoints successfully

## 6. Files to Create

- `PHASE1_IMPLEMENTATION_PLAN.md`
- `tools/registry-readonly-lib.js`
- `tools/registry-readonly.js`
- `tools/registry-readonly-server.js`
- `tools/verify-phase1-readonly.js`
- `PHASE1_READONLY_SURFACE.md`

## 7. Verification Commands

Planned local verification:

```bash
node tools/verify-phase1-readonly.js
node tools/registry-readonly.js stats
node tools/registry-readonly.js list --type solution_proof --domain biology --limit 3
node tools/registry-readonly.js get err-api-004
node tools/registry-readonly.js resolve sol-maya-001
node tools/registry-readonly-server.js
```

## 8. Success Criteria

Phase 1 is locally satisfied if:
- the new surface can list and fetch registry data read-only
- alias resolution works against existing alias data
- the HTTP surface exposes minimal read-only access without mutation paths
- no write path is introduced into registry artifacts
- the implementation stays within the Phase 1 architectural boundary
