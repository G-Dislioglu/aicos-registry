# Maya

Maya is a separate product web app inside this repo: a mobile-first, text-only, single-user personal assistive surface.

## Phase 1 scope

- Home screen with focus cards
- Chat screen with a simple local chat API
- Context screen with profile, projects, and curated memory
- small seed data model
- de/en language switching with `de` as default
- PWA manifest + service worker registration
- Render-ready deployment config

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- App Router

## Local start

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open:

```text
http://localhost:3000
```

## Production build

```bash
npm run build
npm start
```

## Type check

```bash
npm run typecheck
```

## Screens

- `/` Home
- `/chat` Chat
- `/context` Context
- `/api/chat` Local chat API
- `/api/health` Health endpoint

## Language

- visible product name: `Maya`
- supported languages: `de`, `en`
- default language: `de`
- language choice is stored in local browser storage
- UI text, seed data, and local Maya responses follow the selected language

## Product boundaries

Maya Phase 1 intentionally does **not** include:

- voice
- vision
- tools / automation engine
- device control
- hidden AICOS or Soulmatch write paths
- broad provider integrations
- governance/scoring expansion

## Render deploy

This project ships with its own `render.yaml` inside `maya-core/`.

Recommended setup:

- Root Directory: `maya-core`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Node: `20.x`

If you use Render Blueprint support, point it at `maya-core/render.yaml`.

## Notes

- The current chat loop is intentionally simple and local.
- Seed data is in `lib/seed-data.ts`.
- The assistant response logic is in `lib/maya-engine.ts`.
- The visible product name is `Maya`; the folder can remain `maya-core/` for now.
- This project is intentionally isolated from the registry runtime app.
