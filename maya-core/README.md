# Maya

Maya is a separate product web app inside this repo: a mobile-first, text-only, single-user personal assistive surface.

## Phase 1.3 runtime

Maya Phase 1.3 keeps the Phase 1.2 product surface intact while making the runtime deployable as a real single-user web service.

The app now includes:

- editable personal layer for profile, projects, and curated memory
- persistent sessions and chat history
- single-user passphrase gate with signed cookie session
- deployable persistent storage with Postgres on Render
- local file-backed fallback for local development only
- de/en UI with `de` as the default seed language
- PWA manifest + service worker registration

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Postgres via `pg`

## Runtime model

Maya uses a small storage adapter controlled by `MAYA_STORAGE_DRIVER`.

- `postgres`
  - intended production/runtime path
  - durable storage on Render via `DATABASE_URL`
- `file`
  - local development path
  - persists to `data/maya-store.json`

When the store is empty, Maya bootstraps from `lib/seed-data.ts` and writes the normalized initial state into the active storage backend.

## Required environment variables

Copy `.env.example` and fill the values you need.

```bash
MAYA_STORAGE_DRIVER=postgres
DATABASE_URL=
MAYA_AUTH_SECRET=
MAYA_PASSPHRASE=
MAYA_SEED_LANGUAGE=de
```

Notes:

- On Render, Maya should run with `MAYA_STORAGE_DRIVER=postgres`.
- In local development, Maya defaults to `file` if no storage driver is set.
- In local development only, Maya falls back to a local passphrase `maya-local` if no explicit auth envs are set.
- In production/Render, auth secrets must be explicitly configured.

## Local start

1. Install dependencies:

```bash
npm install
```

2. Choose a local runtime mode:

- simplest local mode:

```bash
set MAYA_STORAGE_DRIVER=file
set MAYA_PASSPHRASE=maya-local
set MAYA_AUTH_SECRET=maya-local-auth-secret
```

- or use Postgres locally by setting `MAYA_STORAGE_DRIVER=postgres` and `DATABASE_URL`

3. Start the app:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

5. Unlock Maya with your passphrase.

## Production build

```bash
npm run build
npm start
```

## Type check

```bash
npm run typecheck
```

## Routes

- `/` Gateway / Start
- `/maya` Empfohlener Maya-Arbeitsbereich
- `/chat` Älterer Chat-Pfad
- `/context` Unterstützender Kontextbereich
- `/supervisor` Interner Supervisor-Raum
- `/login` Single-user gate
- `/api/state` Persistent state API
- `/api/chat` Persistent chat API
- `/api/maya/*` Maya workspace APIs
- `/api/supervisor/*` Supervisor APIs
- `/api/auth/login` Login endpoint
- `/api/auth/logout` Logout endpoint
- `/api/auth/session` Session status endpoint
- `/api/health` Health endpoint

## Health endpoint

`/api/health` is the public lightweight runtime health endpoint.

It is distinct from the authenticated Maya workspace health surface under `/api/maya/health`.

In the current code, `/api/health` returns a lightweight JSON response for runtime availability:

- `status`
- `app`

It does not currently perform database, auth, provider, or workspace health checks.

## Render deploy

This project ships with its own `render.yaml` inside `maya-core/`.

The blueprint now provisions:

- one Node web service
- one Render Postgres database
- generated `MAYA_AUTH_SECRET`
- required `DATABASE_URL`
- explicit `MAYA_STORAGE_DRIVER=postgres`

Manual Render setup should match:

- Root Directory: `maya-core`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Node: `20.x`
- Environment:
  - `MAYA_STORAGE_DRIVER=postgres`
  - `DATABASE_URL=<Render Postgres connection string>`
  - `MAYA_AUTH_SECRET=<strong random secret>`
  - `MAYA_PASSPHRASE=<your private single-user passphrase>`
  - `MAYA_SEED_LANGUAGE=de` or `en`

If you use Render Blueprint support, point it at `maya-core/render.yaml`.

## Product boundaries

Maya intentionally does **not** include:

- voice
- vision
- tools / automation engine
- device control
- hidden AICOS or Soulmatch write paths
- broad provider integrations
- multi-user/team auth
- governance/scoring expansion

Visible repo note:

- the current repo does include additional Maya workspace surfaces under `/maya` and `/api/maya/*`
- it also includes an internal supervisor surface under `/supervisor` and `/api/supervisor/*`
- these visible surfaces should not be read as proof that the product is already fully consolidated

## Notes

- The older `/chat` path still uses `lib/maya-engine.ts`.
- The visible `/maya` workspace runs through the `/api/maya/*` stack.
- The visible product name remains `Maya`.
- The folder can remain `maya-core/`.
- This product remains intentionally isolated from the registry runtime app.
