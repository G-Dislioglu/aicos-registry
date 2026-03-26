# STATE

## Zweck

Diese Datei ist die kanonische operative Kurzwahrheit für `maya-core`.
Sie ist der schnellste Einstieg für neue Chats, für externe Web-KIs und für die laufende Blockplanung.

Diese Datei ist kein Ersatz für `README.md`, `AGENTS.md` oder `docs/spec-packs/products/maya/STATUS.md`, sondern deren kompakte Arbeitsverdichtung.

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
2. `AGENTS.md`
3. `README.md`
4. `docs/spec-packs/products/maya/STATUS.md`
5. `docs/spec-packs/products/maya/BLUEPRINT.md`
6. `RADAR.md`
7. danach erst relevante Handoffs oder Proposal-Dateien

## Executive Summary

`/maya` ist die primäre Maya-Hauptfläche in `maya-core`.

Die aktuell veröffentlichte UI-Linie ist die lokale Dreierstufe aus Primary-Surface-Compression, Secondary-Navigation-Rationalization und page-level Frame-Compression. Damit ist `/maya` sichtbar stärker um den aktiven Arbeitslauf als Primärfläche verdichtet.

Die Architektur bleibt technisch hybrid: sichtbare Maya-Flächen, Surface-State, ältere State-/Persistenzlinien und neuere `/api/maya/*`-Linien koexistieren weiter. Neue Arbeit darf diesen Hybridzustand nicht stillschweigend als bereits abgeschlossene Ein-Achsen-Architektur ausgeben.

## Current Published Truth

- `origin/master` ist aktuell auf `ed10c06`
- Die veröffentlichte Maya-UI-Dreierstufe ist enthalten:
  - `9a53ac8` — `refactor(maya): compress primary surface around workrun flow`
  - `a95068f` — `refactor(maya): rationalize secondary navigation surface`
  - `ed10c06` — `refactor(maya): compress page-level hero and context framing`
- `app/maya/page.tsx` rahmt den Einstieg jetzt knapper und überlässt die Hauptarbeit `MayaChatScreen`
- `components/maya-chat-screen.tsx` bindet die extrahierten UI-Teile sichtbar ein

## Current Local Working Truth

- Der lokale Working Tree ist weiterhin breit dirty
- Relevante lokale Maya-Themen außerhalb der veröffentlichten UI-Trilogie existieren weiterhin, u. a. in API-, Affect-, Persistenz-, Doku- und Infra-nahen Dateien
- Diese lokale Restlage ist nicht automatisch Teil der publizierten Maya-UI-Wahrheit

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

### Continuity / Digest

- `lib/maya-thread-digest.ts` ist der aktive Continuity-/Digest-Kern
- lokale UI-Residualdateien mit ähnlichen Namen sind nicht automatisch aktive Hauptwahrheit

### Sichtbare UI-Wahrheit nach der Trilogie

- aktiver Arbeitslauf ist die Primärfläche
- sekundäre Navigation ist verdichtet und klarer nachgeordnet
- page-level framing ist knapper und weniger dashboard-lastig

## Hybrid Zones / Known Contradictions

- State-/Persistenzlinie und `/api/maya/*`-Linie sind weiterhin nicht vollständig vereinheitlicht
- Published UI-Kompression und breiter lokaler Dirty Tree existieren parallel
- tiefere lokale Doku-, API- und Affect-Stränge dürfen nicht automatisch als Teil derselben Produktlinie gelesen werden

## Active Sources Of Truth

- schnelle operative Wahrheit: `STATE.md`
- Arbeitsregeln und Guardrails: `AGENTS.md`
- ausführlicher Repo-/Verifikationsstand: `docs/spec-packs/products/maya/STATUS.md`
- Produktzielbild: `docs/spec-packs/products/maya/BLUEPRINT.md`
- Ideen-, Proposal- und Spec-Radar: `RADAR.md`
- `RADAR.md` steuert außerdem die kontrollierte Ideenaufnahme via Scan, Destillation, Cross-Combination und Maya-Fit-Prüfung

## Last Completed Block

### Name

Active Workrun Detail Downshift

### Ergebnis

Die Maya-Hauptfläche ist weiter verdichtet: Der aktive Arbeitslauf zeigt primär nur noch Fokus, nächsten Schritt, offenen Kernpunkt, letzten Output und direkte Fortsetzungsaktionen. Manuelle Steuerung, Handoff-/Wiedereinstiegsdetails und Checkpoint-Pflege liegen jetzt in der sekundären Ops-Lens, ohne Runtime- oder Persistenzpfade umzubauen.

### Nicht Teil dieses Blocks

- großer Mehrflächen-Rebuild der Maya-Hauptfläche
- Runtime-Konsolidierung zwischen Achse A und Achse B
- Affect-Expansion
- API-Neuschnitt
- Persistenzumbau

## Next Recommended Block

### Name

Handoff Prominence Tightening

### Ziel

Die verbleibende Sichtbarkeit von Handoff-/Wiedereinstiegsdetails nur dort weiter zu reduzieren, wo sie nicht klar vom Primärfokus abweichen, ohne wichtige Park-/Resume-Signale zu verlieren.

### Scope

- Handoff-/Wiedereinstiegsdetails in der Lens noch enger an echte Abweichung oder Park-/Abschlusszustände binden
- Primär- und Sekundärsignale zwischen Arbeitslauf und Handoff weiter entdoppeln
- UI nur in der vorhandenen Lens-/Workrun-Schicht nachschärfen

### Nicht-Scope

- großer UI-Rebuild über mehrere Screen-Modi gleichzeitig
- Affect-/Provider-/Persistenz-Expansion
- implizite Architektur-Neuentscheidung
- großer Dirty-Tree-Abbau

## Alternative Valid Next Blocks

- kleiner K5-Folgeblock zur internen Surface-State-Verschiebung Richtung Achse B
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

- `AGENTS.md`
- `README.md`
- `docs/spec-packs/products/maya/STATUS.md`
- `RADAR.md`
- danach erst relevante Detaildateien

Externe Reviews sollen klar trennen zwischen:

- publizierter Wahrheit
- lokalem Arbeitsstand
- Zielbild
- geparkten oder unadoptierten Ideen

## Next Chat Bootstrap

Wenn ein neuer Chat startet oder Kontextverlust droht:

1. `STATE.md` lesen
2. `AGENTS.md` lesen
3. `RADAR.md` lesen
4. letzten publizierten und lokalen Block benennen
5. erst dann den nächsten Maya-Block schneiden
