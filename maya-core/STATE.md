# STATE

## Zweck

Diese Datei ist die kanonische operative Kurzwahrheit für `maya-core`.
Sie ist der schnellste Einstieg für neue Chats, für externe Web-KIs und für die laufende Blockplanung.

Diese Datei ist kein Ersatz für `README.md`, `AGENTS.md` oder `docs/spec-packs/products/maya/STATUS.md`, sondern deren kompakte Arbeitsverdichtung.

## STATE HEADER

- `current_repo_head`: `91552c2`
- `last_runtime_commit`: `9bdaa3a`
- `last_verified_against_public`: `2026-03-27`
- `truth_scope`: `public_plus_local`
- `local_drift_present`: `yes`
- `hybrid_architecture`: `yes`
- `primary_runtime_seams`: `/api/maya/chat | /api/maya/surface-state | lib/maya-thread-digest.ts`
- `last_completed_block`: `Guardrail Signal Calibration`
- `next_recommended_block`: `Surface-State Axis Shift Follow-Up`
- `read_order_version`: `v2`

## Update-Vertrag

Diese Datei muss nach jedem wichtigen Maya-Block geprüft und bei Bedarf aktualisiert werden.

Pflicht-Update bei:

- Änderung der sichtbaren Maya-Hauptfläche
- Änderung der aktuellen Architekturwahrheit
- Commit/Push eines wichtigen Maya-Blocks
- Änderung des empfohlenen nächsten Blocks
- neuer belastbarer lokaler oder publizierter Repo-Befund

Wenn diese Datei nicht mehr zum Code- oder Git-Stand passt, gilt sie als veraltet und muss gezielt nachgezogen werden.

## Lesereihenfolge

Für neue Arbeit an `maya-core` zuerst lesen:

1. `STATE.md`
2. `RADAR.md`
3. `README.md`
4. `AGENTS.md`
5. `docs/spec-packs/products/maya/STATUS.md`
6. `docs/spec-packs/products/maya/BLUEPRINT.md`
7. danach erst relevante Handoffs oder Proposal-Dateien

## Truth Classes

- `Current Published Truth` = repo-sichtbare, veröffentlichte Maya-Linie
- `Current Local Working Truth` = lokaler, noch nicht veröffentlichter Arbeitsstand
- `Current Architecture Reality` = strukturelle Laufzeitlage auch dann, wenn sie technisch hybrid bleibt
- proposal-only Material darf nicht stillschweigend als aktive Produktwahrheit gelesen werden

## Executive Summary

`/maya` ist die primäre Maya-Hauptfläche in `maya-core`.

Die aktuell veröffentlichte Maya-Linie verbindet die publizierte UI-Verdichtung mit einem engen epistemischen Nachlauf: Primary-Surface-Compression, Secondary-Navigation-Rationalization, page-level Frame-Compression, Active-Workrun-Detail-Downshift in die Ops-Lens, ein post-dispatch Guardrail für Mirror-/Warning-Signale und eine nachgezogene Lens-Nachschärfung für geringere Handoff-Prominenz. Damit bleibt `/maya` als Primärfläche ruhig, während Guardrail- und Wiedereinstiegssignale sekundär in der Ops-Lens bleiben.

Die Architektur bleibt technisch hybrid: sichtbare Maya-Flächen, Surface-State, ältere State-/Persistenzlinien und neuere `/api/maya/*`-Linien koexistieren weiter. Neue Arbeit darf diesen Hybridzustand nicht stillschweigend als bereits abgeschlossene Ein-Achsen-Architektur ausgeben.

## Current Published Truth

- `origin/master` ist aktuell auf `91552c2`
- Die letzte user-sichtbare Maya-Produktlinie bleibt auf `9bdaa3a`; spätere öffentliche Commits wie `bb42875` und `91552c2` waren Doku-/Review-Syncs statt neuer sichtbarer Maya-Runtime-Blöcke.
- Die veröffentlichte Maya-Linie ist jetzt in einem Satz: Primärfläche um den aktiven Arbeitslauf verdichtet, sekundäre Navigation rationalisiert, page-level Framing gestrafft, Arbeitslaufdetails in die Ops-Lens verlagert, post-dispatch Guardrail-Signale erzeugt, in der Lens sekundär gesurfacet und zuletzt noch auf ruhigere Warnsignale kalibriert.
- Die veröffentlichte Verdichtungslinie ist enthalten:
  - `9a53ac8` — `refactor(maya): compress primary surface around workrun flow`
  - `a95068f` — `refactor(maya): rationalize secondary navigation surface`
  - `ed10c06` — `refactor(maya): compress page-level hero and context framing`
  - `dcdc9b5` — `feat(maya): consolidate ops lens and workrun details`
  - `094dd50` — `feat(maya): add post-dispatch epistemic guardrail`
  - `45a7b95` — `feat(maya): tighten handoff prominence in ops lens`
  - `9bdaa3a` — `refactor(maya): calibrate guardrail signal surfacing`

## Current Local Working Truth

- Der lokale Working Tree ist weiterhin breit dirty
- Relevante lokale Maya-Themen außerhalb der veröffentlichten Maya-Verdichtungslinie existieren weiterhin, u. a. in API-, Affect-, Persistenz-, Doku- und Infra-nahen Dateien

## Current Architecture Reality

### Produktordnung

- `/maya` = primäre Companion Surface
- `/chat` = legacy / explorativ, nicht gleichrangige Hauptfläche
- `/context` = unterstützende Kontextfläche
- `/supervisor` = interner Sonderraum

### Laufzeitrealität

- Die Maya-Runtime ist weiterhin hybrid
- `app/maya/page.tsx` liest Surface-State über `/api/maya/surface-state`
- Der zugrunde liegende Gesamtzustand bleibt jedoch nicht als vollständig auf eine neue Achse konsolidiert zu behandeln

### Primäre Runtime-Seams

- `/api/maya/chat` bleibt die zentrale Dispatch- und Guardrail-Naht für Maya-Antworten
- `/api/maya/surface-state` bleibt die sichtbare Surface-State-Lesenaht der Hauptfläche
- `lib/maya-thread-digest.ts` bleibt die aktive Continuity-/Digest-Naht

### Continuity / Digest

- `lib/maya-thread-digest.ts` ist der aktive Continuity-/Digest-Kern
- lokale UI-Residualdateien mit ähnlichen Namen sind nicht automatisch aktive Hauptwahrheit

### Sichtbare UI-Wahrheit nach den Folgeblöcken

- aktiver Arbeitslauf ist die Primärfläche
- sekundäre Navigation ist verdichtet und klarer nachgeordnet
- page-level framing ist knapper und weniger dashboard-lastig
- Handoff- und Guardrail-Signale bleiben sekundär in der Ops-Lens statt auf der Primärfläche

## Hybrid Zones / Known Contradictions

- State-/Persistenzlinie und `/api/maya/*`-Linie sind weiterhin nicht vollständig vereinheitlicht
- Published UI-Kompression und breiter lokaler Dirty Tree existieren parallel

## Active Sources Of Truth

- schnelle operative Wahrheit: `STATE.md`
- Arbeitsregeln und Guardrails: `AGENTS.md`
- ausführlicher Repo-/Verifikationsstand: `docs/spec-packs/products/maya/STATUS.md`
- Produktzielbild: `docs/spec-packs/products/maya/BLUEPRINT.md`
- Ideen-, Proposal- und Spec-Radar: `RADAR.md`
- `RADAR.md` steuert außerdem die kontrollierte Ideenaufnahme via Scan, Kompression, Cross-Combination und Maya-Fit-Prüfung

## Last Completed Block

### Name

Guardrail Signal Calibration

### Ergebnis

Der enge post-dispatch Guardrail wurde nachkalibriert: repo- und code-geerdete Antworten erzeugen weniger unnötige Overclaim-/Freshness-Warnungen, und sekundäres Guardrail-Surfacing erscheint in Topbar und Ops-Lens nur noch bei echten Warnsignalen statt schon bei bloßer Mirror-Spiegelung. Die Guardrail-Linie bleibt damit bewusst heuristisch, aber ruhiger und Maya-näher im tatsächlichen Arbeitsfluss.

### Nicht Teil dieses Blocks

- zusätzlicher Vorab-LLM-Call oder Deep-Mode
- Runtime-Konsolidierung zwischen Achse A und Achse B
- Affect-Expansion
- Memory-/Review-Queue-/Surface-State-Vertragserweiterung
- Persistenz- oder Schema-Umbau

## Next Recommended Block

### Name

Surface-State Axis Shift Follow-Up

### Ziel

Den nächsten kleinen K5-Folgeschritt so zu schneiden, dass einzelne Surface-State-Verantwortungen weiter Richtung Achse B verschoben werden, ohne UI-, Provider- oder Persistenz-Scope gleichzeitig aufzureißen.

### Aufwand / Risikoprofil

- klein bis mittel, als bewusster Technik-Folgeblock
- primär interner Surface-State-/Adapter-Scope
- höheres Risiko als UI-/Doku-Nachschärfung, deshalb bewusst getrennt halten

### Scope

- kleine, klar benennbare Verschiebung einzelner Surface-State-Verantwortungen Richtung Achse B
- Adapter- oder Vertragsgrenzen explizit halten statt stillschweigend eine Ein-Achsen-Realität zu behaupten
- UI- und Guardrail-Linie dabei unvermischt lassen

### Nicht-Scope

- großer UI-Rebuild über mehrere Screen-Modi gleichzeitig
- Provider-/Affect-/Persistenz-Expansion
- implizite Architektur-Neuentscheidung
- breiter Misch-Commit aus dem lokalen Dirty Tree

## Alternative Valid Next Blocks

- enger Doku-/Review-Block zur Nachweisführung und Beobachtung der kalibrierten Guardrail-Signale
- `Pre-Dispatch Crush Light` (siehe `RADAR.md`, Kandidat E2) als bewusster Miniblock vor `dispatchChat()`, falls statt Achse-B-Adapterarbeit ein enger epistemischer Intake-Block priorisiert werden soll
- `Truth-Marked Continuity Transfer Contract` (siehe `RADAR.md`, Kandidat C) als späterer bounded Vertrags- und Kontinuitätsblock statt Runtime-Folgeschritt
- gezielter Doku-/Triage-Block für lokale Maya-Residuallinien und Planungsartefakte
- begrenzte lokale Hygiene für untracked Maya-Residualdateien, aber nicht als Hauptproduktblock

## Not Now

- großer Architekturumbau
- stillschweigende Promotion von `/chat`
- Residual-UI-Dateien als künstlicher Hauptblock
- breiter Misch-Commit aus dem lokalen Dirty Tree

## Guardrails

- `/maya` bleibt primäre Companion Surface
- `/chat` wird nicht stillschweigend wieder zur gleichrangigen Hauptfläche gemacht
- Ist-Zustand, lokale Arbeitslage und proposal-only Material strikt trennen
- `lib/maya-thread-digest.ts` nicht wegen Namensähnlichkeit mit lokalen UI-Resten verwechseln
- lokale Residualdateien nicht automatisch zu Git-Blöcken machen
- Affect, API und Persistenz nur bei explizitem Scope berühren

## External Review Use

Externe Web-KIs sollen diese Datei zuerst lesen und danach:

- `RADAR.md`
- `README.md`
- `AGENTS.md`
- `docs/spec-packs/products/maya/STATUS.md`
- `docs/spec-packs/products/maya/BLUEPRINT.md`
- danach erst relevante Detaildateien

Externe Reviews sollen klar trennen zwischen:

- publizierter Wahrheit
- lokalem Arbeitsstand
- Zielbild
- geparkten oder unadoptierten Ideen

## Next Chat Bootstrap

Wenn ein neuer Chat startet oder Kontextverlust droht:

1. `STATE.md` lesen
2. `RADAR.md` lesen
3. `README.md` lesen
4. `AGENTS.md` lesen
5. letzten publizierten und lokalen Block benennen
6. erst dann den nächsten Maya-Block schneiden
