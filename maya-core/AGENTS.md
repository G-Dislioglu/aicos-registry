# AGENTS.md

## Rolle dieses Dokuments

Arbeitsgedächtnis des Agenten — ergänzt README, BLUEPRINT und STATUS.

Diese Datei ist kein Ersatz für die anderen Kern-Dokumente und kein Freibrief für implizite Architekturentscheidungen.

## Pflicht-Lesereihenfolge vor Maya-Arbeit

1. `STATE.md`
2. `RADAR.md`
3. `README.md`
4. `AGENTS.md`
5. `docs/spec-packs/products/maya/STATUS.md`
6. `docs/spec-packs/products/maya/BLUEPRINT.md`
7. `DESIGN.md`
8. aktives Proposal unter `docs/spec-packs/products/maya/proposals/`

## Read → Act → Sync-Protokoll

### Read

Vor jedem Maya-Block explizit prüfen:

- Ist `/maya` weiterhin die primäre Maya-Oberfläche?
- Wird `/chat` nicht stillschweigend wieder zur gleichrangigen Hauptfläche gemacht?
- Bleibt `/context` unterstützend und `/supervisor` intern?
- Ist klar getrennt, was aktueller Ist-Zustand und was proposal-only Material ist?
- Berührt der Block Routing, `app-shell.tsx`, `primary-nav.tsx` oder die sichtbare Hauptführung?

### Relevante Review-Dateien für externe KI-Arbeit

- Immer relevant:
  - `maya-core/STATE.md`
  - `maya-core/RADAR.md`
- Oft relevant bei Maya-Arbeit:
  - `maya-core/AGENTS.md`
  - `maya-core/DESIGN.md`
  - `maya-core/docs/spec-packs/products/maya/STATUS.md`
- Bei Wissensabgleich / Crossings:
  - `index/INDEX.json`
  - `human/REGISTRY.md`
- Nur bei konkretem Bedarf einzeln nachziehen:
  - `BLUEPRINT.md`
  - `CONTRACT.md`
  - `CANON.md`
  - `CONTINUITY.md`
  - K5-Notizen
  - Handoffs

### Act

Nur das ändern, was für den aktiven Block nötig ist.

Hard stop und nachfragen bei Widerspruch in:

- Routing oder Primacy
- Promotion von `/chat`
- neuer above-the-fold Hauptstruktur auf `/maya`
- stillschweigender Änderung der Produktentscheidung

### Sync

Nach jedem relevanten Block:

- `STATE.md` auf aktuellen veröffentlichten, lokalen und empfohlenen Arbeitsstand prüfen und nachziehen
- `RADAR.md` auf neue Scan-Kandidaten, Statuswechsel oder absorbierte Ideen prüfen und nachziehen
- `STATUS.md` auf sichtbare Änderungen oder neue Infra-Fakten prüfen und nachziehen
- `AGENTS.md` auf neue Arbeitsregeln oder aktive Block-Kontexte prüfen und nachziehen
- `BLUEPRINT.md` nur ändern, wenn der Block ausdrücklich Blueprint-Änderungen umfasst; sonst nur Änderungsvorschlag benennen

### Post-Push-Protokoll für externe KI-Reviews

Nach jedem erfolgreichen `git push` immer zusätzlich einen Raw-URL-Block ausgeben.

Pflichtablauf:

1. frischen Commit-Hash holen mit `git rev-parse HEAD`
2. geänderte Dateien des letzten Push-Commits holen mit `git diff --name-only HEAD~1 HEAD`
3. folgenden Block ausgeben:

```md
# URLs für externe KI-Reviews

Aktueller Commit: {COMMIT_HASH}

## Immer zuerst lesen (Maya-Kern)
- https://raw.githubusercontent.com/G-Dislioglu/aicos-registry/{COMMIT_HASH}/maya-core/STATE.md
- https://raw.githubusercontent.com/G-Dislioglu/aicos-registry/{COMMIT_HASH}/maya-core/RADAR.md

## Bei Maya-Arbeit zusätzlich
- https://raw.githubusercontent.com/G-Dislioglu/aicos-registry/{COMMIT_HASH}/maya-core/AGENTS.md
- https://raw.githubusercontent.com/G-Dislioglu/aicos-registry/{COMMIT_HASH}/maya-core/DESIGN.md
- https://raw.githubusercontent.com/G-Dislioglu/aicos-registry/{COMMIT_HASH}/maya-core/docs/spec-packs/products/maya/STATUS.md

## Bei Wissensabgleich / Crossings (AICOS)
- https://raw.githubusercontent.com/G-Dislioglu/aicos-registry/{COMMIT_HASH}/index/INDEX.json
- https://raw.githubusercontent.com/G-Dislioglu/aicos-registry/{COMMIT_HASH}/human/REGISTRY.md

## Geänderte Dateien in diesem Push
{LISTE DER GEÄNDERTEN DATEIEN ALS RAW-URLs}
```

Regeln:

- diesen Block immer nach einem Push ausgeben, ohne Aufforderung
- Commit-Hash immer frisch holen, nie aus dem Gedächtnis einsetzen
- keine nicht existierenden Dateien auflisten
- wenn kein Push stattfindet, keinen URL-Block ausgeben

## Aktuelle Maya-Produktordnung

- `/maya` = primäre Companion Surface in `maya-core`
- `/chat` = legacy / explorativ, nicht gleichrangig
- `/context` = sekundärer Unterstützungsraum
- `/supervisor` = interner Sonderraum

## Aktueller Repo- und Block-Kontext

- K2 Docs Refresh ist abgeschlossen
- K3 Internal Architect ist als Infra-Block abgeschlossen
- K3 ergänzt interne API- und Agentenlogik, ohne die sichtbare Primärachse zu ändern
- K4 ist abgeschlossen:
  - `app/maya/page.tsx` wurde gezielt geändert
  - `/maya` zeigt above the fold vier Fokus-Elemente
  - Maya Brief, Next Step Hero, Context-Strip und Composer sind nach vorn gezogen
  - sekundäre Sections bleiben im Bestand, sind auf der Fokusfläche aber ausgeblendet
  - TypeScript-Prüfung lief grün via `npx tsc --noEmit --skipLibCheck`
- K5 Block 1 ist als Doku-Block abgeschlossen:
  - `docs/spec-packs/products/maya/K5_RUNTIME_AXIS_DECISION_NOTE.md` ist angelegt
  - `/maya` wird technisch als aktueller Hybrid aus Achse A und Achse B beschrieben
  - Achse B ist Zielpfad für neue Execution-Logik
  - Achse A bleibt vorerst Kontinuitäts- und Persistenzachse
- K5 Block 2 ist abgeschlossen:
  - Legacy-/Canonical-Marker sind in den betroffenen Achsen-Dateien gesetzt
  - `app/maya/page.tsx` trägt einen Hybrid-Marker an der sichtbaren Zusammenführung
  - keine Verhaltensänderung, nur K5-Orientierungsmarker
- K5 Block 3 ist als Vorbereitungsblock abgeschlossen:
  - `app/maya/page.tsx` liest sichtbare Kontinuitätsdaten weiter direkt aus `readMayaStore()`
  - für `activeSession`, `activeWorkspace` und `buildMayaMainSurfaceDerivation(...)` ist noch kein gleichwertiger Achse-B-Lesepfad repo-sichtbar
  - daher keine sichere Call-Site-Umstellung in diesem Block; nur Präzisierung des Hybrid-Markers
- K5 Block 4 ist als API-Design-/Vertragsblock abgeschlossen:
  - `app/api/maya/surface-state/route.ts` ist als minimaler Surface-State-Endpunkt angelegt
  - der Vertrag liefert `activeSession`, `activeWorkspace` und `surface`
  - die aktuelle Implementierung ist ein Übergangsadapter und noch keine reine Achse-B-Leselogik
  - `app/maya/page.tsx` wurde bewusst noch nicht umgestellt
  - die Route ist der Vorbereitungsanker für die spätere echte Entkopplung der Call-Site
- K5 Block 5 ist als erste echte Call-Site-Entkopplung abgeschlossen:
  - `app/maya/page.tsx` liest seinen Surface-State jetzt über `/api/maya/surface-state`
  - `readMayaStore()` wird in `app/maya/page.tsx` nicht mehr direkt aufgerufen
  - der serverseitige Fetch verwendet absolute URL, weitergereichte Cookies und `cache: 'no-store'`
  - die Datenquelle hinter dem Vertrags-Endpunkt bleibt vorerst ein Übergangsadapter
- K6 ist als Design-/Architect-Kontext-Block abgeschlossen:
  - `DESIGN.md` ist als agent-lesbare Maya-Design-Referenz angelegt
  - `lib/repo-reader.ts` bindet `DESIGN.md` in `getArchitectContext()` ein
  - `lib/architect-prompt.ts` behandelt `DESIGN.md` als verbindliche Maya-UI-Referenz mit Guardrails zu Presence-Farbe, Jade-Verbot, Presence Orb und Above-the-Fold-Grenzen
  - keine UI- oder Runtime-Datei wurde in diesem Block geändert
- K6.1 ist als Doku-/Prompt-Hardening-Block ergänzt:
  - `lib/architect-prompt.ts` enthält jetzt eine Mirror-Regel für STOP/FRAGE-Antworten ohne neue Architekturideen
  - `DESIGN.md` ergänzt eine Re-Entry-Assumption-Struktur mit `assumption_text`, `type` und `confidence_hint`
  - `DESIGN.md` ergänzt eine STALE-Trigger-Regel für den Context-Strip inklusive Placeholder-Wechsel im Composer
- K7-Prep ist als Guardrail-Vorbereitung angelegt:
  - `tests-e2e/maya-k7-prep.spec.ts` enthält genau einen Smoke-Test und einen Snapshot-Test für `/maya`
  - die erste Snapshot-Baseline bleibt bewusst deferred, bis der manuelle erste Run stabil durchläuft
- K7 Block 1 ist als erste kleine UI-Extraktion umgesetzt:
  - `components/maya/maya-message-feed.tsx` ist neu angelegt
  - der darstellungsnahe Message-Feed aus `components/maya-chat-screen.tsx` ist dorthin ausgelagert
  - `sendMessage`, Persistenz, Workrun-, Workspace- und Handoff-Mutationslogik bleiben in `maya-chat-screen.tsx`
- K7 Block 2 ist als weitere kleine UI-Extraktion umgesetzt:
  - `components/maya/maya-thread-digest.tsx` ist neu angelegt
  - der darstellungsnahe ThreadDigest-/Fadenkompass-Block aus `components/maya-chat-screen.tsx` ist dorthin ausgelagert
  - Digest-Ableitung, Persistenz und Refresh-Logik bleiben in `maya-chat-screen.tsx`
- nächster K5-Folgeschritt: den `surface-state`-Endpunkt intern schrittweise von Achse A in Richtung Achse B verschieben

## K3-Zielartefakte

- `DESIGN.md`
- `app/api/architect/check/route.ts`
- `app/api/architect/sync/route.ts`
- `app/api/architect/next/route.ts`
- `lib/architect-prompt.ts`
- `lib/repo-reader.ts`

## Verifikations- und Laufregeln

- Nicht `npm run typecheck` verwenden
- Nicht `npm run dev` verwenden, wenn bereits ein Dev-Server läuft
- Terminal: Git Bash (kein PowerShell)
- HTTP-Tests: `curl --max-time 10` statt Node-Inline-Scripts
- Für TypeScript-Prüfung bevorzugt schlank prüfen:

```bash
npx tsc --noEmit --skipLibCheck
```

## Terminal-Regeln

IMMER verwenden:

- Git Bash als Standard-Terminal
- POSIX-/Bash-Syntax statt PowerShell-Syntax
- `curl --max-time 10` für HTTP-Tests
- `npx tsc --noEmit --skipLibCheck` für TypeScript-Prüfung

NIEMALS verwenden:

- PowerShell-spezifische Syntax oder Cmdlets
- `Invoke-WebRequest` für lokale Server
- `node -e "...fetch()..."` für HTTP-Calls
- `bash -lc "npx ..."` für stille Prüfkommandos wie `tsc`
- `npm run typecheck`, wenn der Language Server parallel läuft
- `npm run dev`, wenn Server bereits auf Port `3000` läuft

STATTDESSEN:

- HTTP-Calls mit `curl --max-time 10` aus Git Bash ausführen
- TypeScript mit `npx tsc --noEmit --skipLibCheck` prüfen
- für stille TypeScript-Prüfungen ohne sichtbaren Fortschritt den lokalen Binary-Pfad bevorzugen, z. B. `./node_modules/.bin/tsc --noEmit --skipLibCheck`
- `| head -20` nicht als Fortschrittsanzeige für stille Tools wie `tsc` verwenden; ohne Fehloutput bleibt der Prozess sonst scheinbar ohne Ausgabe stehen
- Sync sowie `AGENTS.md`- und `STATUS.md`-Pflege direkt schreiben, wenn der HTTP-Weg instabil ist
- Wenn ein HTTP-Call mehr als 10 Sekunden braucht oder hängt: abbrechen und einen alternativen Weg nehmen

SELBST-ERKENNUNG:

- Wenn ein Terminal-Command nach 30 Sekunden keine Ausgabe zeigt, sofort stoppen und einen alternativen Weg nehmen

## Repo-Stack

Next.js 14 · TypeScript · App Router · Tailwind CSS · PostgreSQL via `pg`

## Disziplinregeln

- Jede Behauptung braucht Repo-, Terminal- oder Dokumentenbeleg
- Proposal-only Material nie als bereits umgesetzt ausgeben
- Keine Änderungen außerhalb des aktiven Blocks
- Bei Drift oder unklarer Kollision: stoppen und benennen statt stillschweigend weiterbauen
