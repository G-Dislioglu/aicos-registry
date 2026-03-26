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

Die aktuell veröffentlichte Maya-Linie verbindet die publizierte UI-Verdichtung mit einem engen epistemischen Nachlauf: Primary-Surface-Compression, Secondary-Navigation-Rationalization, page-level Frame-Compression, Active-Workrun-Detail-Downshift in die Ops-Lens, ein post-dispatch Guardrail für Mirror-/Warning-Signale und eine nachgezogene Lens-Nachschärfung für geringere Handoff-Prominenz. Damit bleibt `/maya` als Primärfläche ruhig, während Guardrail- und Wiedereinstiegssignale sekundär in der Ops-Lens bleiben.

Die Architektur bleibt technisch hybrid: sichtbare Maya-Flächen, Surface-State, ältere State-/Persistenzlinien und neuere `/api/maya/*`-Linien koexistieren weiter. Neue Arbeit darf diesen Hybridzustand nicht stillschweigend als bereits abgeschlossene Ein-Achsen-Architektur ausgeben.

## Current Published Truth

- `origin/master` ist aktuell auf `45a7b95`
- Die veröffentlichte Maya-Linie ist jetzt in einem Satz: Primärfläche um den aktiven Arbeitslauf verdichtet, sekundäre Navigation rationalisiert, page-level Framing gestrafft, Arbeitslaufdetails in die Ops-Lens verlagert, post-dispatch Guardrail-Signale erzeugt und in der Lens sekundär gesurfacet.
- Die veröffentlichte Verdichtungslinie ist enthalten:
  - `9a53ac8` — `refactor(maya): compress primary surface around workrun flow`
  - `a95068f` — `refactor(maya): rationalize secondary navigation surface`
  - `ed10c06` — `refactor(maya): compress page-level hero and context framing`
  - `dcdc9b5` — `feat(maya): consolidate ops lens and workrun details`
  - `094dd50` — `feat(maya): add post-dispatch epistemic guardrail`
  - `45a7b95` — `feat(maya): tighten handoff prominence in ops lens`
- `app/maya/page.tsx` rahmt den Einstieg jetzt knapper und überlässt die Hauptarbeit `MayaChatScreen`
- `components/maya-chat-screen.tsx` bindet die extrahierten UI-Teile sichtbar ein
- `components/maya/maya-workrun-details.tsx` hält manuelle Arbeitslaufsteuerung, Handoff-Details und Checkpoint-Pflege außerhalb der Primärkarte
- `app/api/maya/chat/route.ts` ergänzt jetzt einen engen post-dispatch Guardrail-Nachlauf mit optionalem `epistemicGuardrail`

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
- `RADAR.md` steuert außerdem die kontrollierte Ideenaufnahme via Scan, Destillation, Cross-Combination und Maya-Fit-Prüfung

## Last Completed Block

### Name

Handoff Prominence Tightening + Secondary Guardrail Surfacing

### Ergebnis

Die Ops-Lens wurde weiter nachgeschärft: aktive Handoff-/Wiedereinstiegsdetails erscheinen jetzt nur noch bei echter Abweichung oder bei Park-/Abschlusszuständen, und der neue post-dispatch Guardrail wird nur sekundär als Mirror-/Warning-Surface in der Lens sichtbar gemacht. Die Primärfläche bleibt beim aktiven Arbeitslauf, ohne neue Runtime- oder Persistenzpfade zu öffnen.

### Nicht Teil dieses Blocks

- großer Mehrflächen-Rebuild der Maya-Hauptfläche
- Runtime-Konsolidierung zwischen Achse A und Achse B
- Affect-Expansion
- API-Neuschnitt jenseits des engen Guardrail-Nachlaufs
- Persistenz- oder Surface-State-Umbau

## Next Recommended Block

### Name

Guardrail Signal Calibration

### Ziel

Die neuen Mirror-/Warning-/Freshness-Signale so nachzuschärfen, dass sie in echten Maya-Läufen nützlich bleiben, ohne Overclaim- oder Freshness-Hinweise zu nervös oder zu still zu machen.

### Aufwand / Risikoprofil

- klein, grob `0.5` Tag als enger Kalibrierungsblock
- primär Route-Heuristik und sekundäres Lens-Surfacing
- kein geplanter Provider-, Persistenz-, Memory- oder Surface-State-Umbau

### Scope

- heuristische Schwellen für `overclaimWarning` und `freshnessWarning` an realen False-Positive-/False-Negative-Fällen nachschärfen
- sekundäres Guardrail-Surfacing in der Lens nur dort weiter verdichten, wo Hinweise wirklich nutzen
- bestehende post-dispatch Guardrail-Linie dokumentarisch und UI-seitig konsistent halten

### Nicht-Scope

- zusätzlicher Vorab-LLM-Call oder Deep-Mode
- Memory-/Review-Queue-/Surface-State-Vertragserweiterung
- großer UI-Rebuild über mehrere Screen-Modi gleichzeitig
- implizite Architektur-Neuentscheidung

## Alternative Valid Next Blocks

- kleiner K5-Folgeblock zur internen Surface-State-Verschiebung Richtung Achse B
- enger Doku-/Review-Block zur Kalibrierung und Nachweisführung der neuen Guardrail-Signale
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
