# maya-core

Maya-Begleiterin — Companion-App im Monorepo.

## Schneller Einstieg

Für neue Chats, externe Web-KIs und Blockplanung zuerst lesen:

- `STATE.md` — operative Kurzwahrheit für aktuellen Stand, Guardrails und nächste Schritte
- `RADAR.md` — Ideen-, Spec- und Proposal-Radar mit Scan-, Destillations- und Maya-Fit-Logik
- `AGENTS.md` — Arbeitsregeln und Sync-Protokoll

## Hauptoberfläche

`/maya` ist die primäre Maya-Hauptfläche.
Maya agiert dort als Companion Surface: orientiert, spiegelt, führt, fokussiert.

## Weitere Routen

| Route | Rolle |
|---|---|
| `/maya` | Primär — Companion Surface, Hauptarbeitsfläche |
| `/chat` | Legacy/explorativ — nicht mehr primäre Produktachse |
| `/context` | Sekundär — Kontext-/Memory-/Arbeitsinformationen |
| `/supervisor` | Intern — Operator-/Sonderraum, kein Primär-UX |

## Source of Truth

Für Produktentscheidungen, offenen Stand und Umbauaufträge:
→ `docs/spec-packs/products/maya/`

Für den schnellsten operativen Einstieg auf Root-Ebene:

- `STATE.md` — aktuelle veröffentlichte und lokale Arbeitswahrheit
- `RADAR.md` — prüfbare Ideen, Destillationen und mögliche nächste Blöcke
- `AGENTS.md` — Lese-, Arbeits- und Sync-Regeln

- `BLUEPRINT.md` — Produktentscheidung und Raumlogik für `maya-core`
- `STATUS.md` — ehrlicher aktueller Stand
- `proposals/` — konkrete Umbauaufträge, noch nicht automatisch umgesetzt

## Stack

Next.js App Router · TypeScript · Tailwind CSS · PostgreSQL via `pg`
