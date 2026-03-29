# MAYA HYBRID TRUTH READABILITY AUDIT

## Zweck

Diese Datei ist ein kleiner repo-naher Lesbarkeits-Audit für externe Mitleser, Web-KIs und neue Chats.

Sie ersetzt weder `STATE.md` noch `docs/spec-packs/products/maya/STATUS.md`, sondern schneidet bewusst nur die aktive Hybrid- und Truth-Grenze an einer kleinen Zahl zentraler Maya-Seams.

Die Datei soll helfen, drei Dinge nicht zu vermischen:

- public repo-visible truth
- local-only working truth
- status-, review- oder proposal-nahe Sprache

## Nicht-Ziele

- kein Architekturumbau
- kein neuer Runtime-Vertrag
- keine neue UI- oder Dispatch-Mechanik
- keine Vollinventur des gesamten Repos
- keine implizite Behauptung, dass der Hybridzustand bereits bereinigt ist

## Prüfscope

Dieser Audit betrachtet nur diese aktiven Maya-Seams:

1. `app/maya/page.tsx`
2. `components/maya-chat-screen.tsx`
3. `lib/maya-surface-state.ts`
4. `app/api/maya/surface-state/route.ts`
5. `app/api/state/route.ts`
6. `lib/maya-thread-digest.ts`

## Leseregel

Wenn Aussagen aus `STATE.md`, `STATUS.md`, Handoffs oder externen Reviews mit dem sichtbaren Code nicht sauber zusammenpassen, gilt in dieser Reihenfolge:

1. `public repo-visible truth`
2. `local-only working truth`
3. `status/proposal/review language`

Status- oder Review-Sprache darf also nicht still als veröffentlichter GitHub-Zustand gelesen werden.

## Truth-Tabelle

| Bereich | Public repo-visible truth | Local-only / working truth | Status- / proposal- / review language |
|---|---|---|---|
| `app/maya/page.tsx` | Die Seite ist serverseitig an `readMayaSurfaceState()` gekoppelt und liest ihren sichtbaren Surface-State nicht mehr direkt aus `readMayaStore()`. | Lokale Folgearbeiten können diese Call-Site weiter verengen oder ummarkerieren, sind aber nicht automatisch GitHub-sichtbar. | Kommentare, Handoffs oder Blöcke dürfen diese Stelle nicht als bereits vollständig auf eine reine neue Achse migriert ausgeben. |
| `components/maya-chat-screen.tsx` | Die Runtime-Fläche nutzt weiter parallele Pfade, darunter `/api/state` und `/api/maya/surface-state`, und hält Bootstrap-/Fallback-Ableitungen aktiv. | Lokale Anpassungen an Guardrail-, Surface-State- oder Digestschnittstellen können weiter sein als der veröffentlichte Stand. | Review-Sprache darf die Fläche nicht als bereits vollständig enthybridisiert lesen, solange diese Parallelität sichtbar bleibt. |
| `lib/maya-surface-state.ts` | Der Surface-State-Endpunkt liefert eine abgeleitete Hauptoberfläche, bleibt aber noch ein Übergangsadapter über `readMayaStore()`. | Lokale Verengungen des Rückgabeformats oder weitere Vertragsanpassungen können existieren, ohne bereits veröffentlicht zu sein. | Doku darf daraus keine abgeschlossene Achse-B-Quellenmigration ableiten. |
| `app/api/maya/surface-state/route.ts` | Die Route ist die sichtbare Read-Naht für den Maya-Surface-State. | Lokale Umbauten an ihrem Vertragsumfang oder an ihrer internen Datenquelle sind ohne Commit/Push nicht public truth. | Statussprache darf die Route als bestehende Vertragsnaht benennen, aber nicht als Beweis einer bereits reinen Ein-Achsen-Leselogik verwenden. |
| `app/api/state/route.ts` | Die ältere State-/Persistenzlinie bleibt repo-sichtbar vorhanden. | Lokale Entkopplungsarbeiten können diese Linie relativieren, aber nicht rückwirkend aus dem veröffentlichten Zustand entfernen. | Externe Reviews sollen ihre weitere Existenz als reale Hybrid-Zone lesen, nicht bloß als historische Fußnote. |
| `lib/maya-thread-digest.ts` | Diese Datei bleibt die aktive Continuity-/Digest-Naht der Hauptableitung, einschließlich `buildContinuityBriefing()`, `buildResumeActions()` und `buildMayaMainSurfaceDerivation()`. | Lokale Observation-, Boundary- oder Distinctness-Blöcke rund um Digest-, Resume- oder Primary-Surface-Kanten können zahlreicher sein als GitHub aktuell zeigt. | Status- und Handoff-Sprache darf lokale Review-Abschlüsse nicht automatisch als vollständig veröffentlichte Repo-Wahrheit ausgeben. |

## Verdichtete Befunde

### Public repo-visible

- `/maya` bleibt die primäre Maya-Hauptfläche.
- Die Runtime bleibt sichtbar hybrid.
- `app/maya/page.tsx` liest serverseitig über `readMayaSurfaceState()`.
- `components/maya-chat-screen.tsx` hält weiterhin Parallelität zwischen älteren State-/Persistenzpfaden und Maya-spezifischen Pfaden.
- `lib/maya-surface-state.ts` und `app/api/maya/surface-state/route.ts` bilden eine reale, aber noch übergangshafte Surface-State-Lesenaht.
- `lib/maya-thread-digest.ts` bleibt die maßgebliche Continuity-/Digest-Naht für die Hauptableitung.

### Local-only / working truth

- Lokale Tests, Verengungen, Follow-up-Verträge und Review-Blöcke können weiter sein als GitHub aktuell zeigt.
- Untracked oder ungepushte Dateien sind keine public repo-visible truth, auch wenn sie im lokalen Workspace bereits belastbar erscheinen.
- Externe Web-KIs können diese lokale Wahrheit nur dann stabil lesen, wenn sie eingecheckt und gepusht wurde.

### Status-, review- und proposal-nahe Sprache

- `STATE.md` und `STATUS.md` dürfen lokale Block- und Review-Fortschritte festhalten.
- Diese Sprache muss aber klar erkennbar zwischen veröffentlichtem Stand und lokalem Arbeitsstand unterscheiden.
- Externe Reviews sollten deshalb nicht einzelne Formulierungen isoliert lesen, sondern immer zusammen mit `truth_scope`, `local_drift_present` und diesem Audit.

## Arbeitsregel für externe Reviews

Vor einer externen ChatGPT- oder Web-KI-Planung zuerst prüfen:

1. Ist der relevante Maya-Befund auf GitHub wirklich sichtbar?
2. Oder stammt er nur aus lokalem Working Tree, untracked Dateien oder ungepushten Änderungen?
3. Handelt es sich um aktive Runtime-Wahrheit, lokale Arbeitswahrheit oder nur um Status-/Review-Sprache?

Wenn diese drei Fragen nicht sauber beantwortet sind, soll kein externer Review daraus still einen Architektur- oder Prioritätswechsel ableiten.

## Folge für die Blockplanung

Dieser Audit verschiebt nicht automatisch den fachlichen Maya-Plan.

Er schafft nur eine lesbarere Ausgangslage für externe Mitplanung:

- erst Hybrid-/Truth-Lesbarkeit sauber schneiden
- dann wieder in den kleineren fachlichen Folgeblock zurückkehren
- aktuell weiter naheliegend: `briefing.openLoops` / `resumeActions(source: 'open_loop')` als enger Vertrags- und Review-Block
