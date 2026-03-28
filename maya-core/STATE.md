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
- `last_completed_block`: `Primary Surface Low-Activity Persisted Partial-Update Boundary Observation Closure`
- `next_recommended_block`: `Primary Surface Low-Activity Persisted Partial-Update Convergence Observation Closure`
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
- Lokal ist jetzt ein enger K5-Folgeschritt umgesetzt: `lib/maya-surface-state.ts` gibt über die Surface-State-Naht nur noch schmale Session-/Workspace-Anker (`id`, `title`) plus die abgeleitete Oberfläche zurück, statt rohe Store-Objekte weiterzureichen
- `components/maya-chat-screen.tsx` ist auf den verengten Surface-State-Vertrag nachgezogen; `npx tsc --noEmit --skipLibCheck` lief danach lokal ohne Fehloutput
- Lokal ist jetzt auch `Pre-Dispatch Crush Light` als enger Achse-B-Mini-Block umgesetzt: `lib/maya-provider-dispatch.ts` ergänzt vor dem Provider-Call einen internen Prompt-Abschnitt, der aus der letzten User-Nachricht den nicht wegstreichbaren Kern ableitet, ohne Request-, UI-, Memory- oder Surface-State-Verträge zu verbreitern
- `__tests__/lib/maya-provider-dispatch.test.ts` verifiziert den neuen Vorab-Schritt gezielt; `npx vitest run __tests__/lib/maya-provider-dispatch.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen lokal ohne Fehloutput

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
- Kompressions-/Resonanz-Methode: `docs/methods/compression-check.md`
- ausführlicher Repo-/Verifikationsstand: `docs/spec-packs/products/maya/STATUS.md`
- Produktzielbild: `docs/spec-packs/products/maya/BLUEPRINT.md`
- Ideen-, Proposal- und Spec-Radar: `RADAR.md`
- `RADAR.md` steuert außerdem die kontrollierte Ideenaufnahme via Scan, Kompression, Cross-Combination und Maya-Fit-Prüfung

## Last Completed Block

### Name

Primary Surface Low-Activity Persisted Partial-Update Boundary Observation Closure

### Ergebnis

Ein einzelner größerer Low-Activity-Evidence-Block ist jetzt lokal abgeschlossen: `__tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-boundary-observation.test.ts` prüft über mehrere signalarme Thread-Konstellationen, dass partielle manuelle Persist-Updates in `workrun`, `handoff` und `workspace` sauber auf ihre builder-eigenen Bahnen begrenzt bleiben und nicht still angrenzende Persist- oder Primärbahnen mitziehen. Damit sind die Grenzbedingungen partieller Persist-Updates enger überprüfbar, ohne neue Runtime-, UI-, Persistenz- oder Surface-State-Mechanik zu öffnen.

### Nicht Teil dieses Blocks

- neue Resume-, Handoff-, Checkpoint-, Workspace-, Quiet-Thread-, Repetition-, Alignment-, Boundary-, Precedence-, Collision-, Partial-Fallback-, Convergence-, Stability-, Persisted-Partial-Update-, Persisted-Partial-Update-Boundary-, Persisted-Partial-Update-Convergence- oder Surface-Mechanik
- neue Runtime-, Dispatch- oder Digest-Mechanik
- neue UI- oder Lens-Surfacing-Felder
- Provider-/Affect-/Persistenz-Expansion
- implizite Behauptung einer bereits abgeschlossenen Ein-Achsen-Architektur

## Next Recommended Block

### Name

Primary Surface Low-Activity Persisted Partial-Update Convergence Observation Closure

### Ziel

Die vorhandenen Persist-Builder jetzt noch einmal als größeren Beobachtungsblock auf signalarme Threads prüfen: wie partielle manuelle Persist-Updates sich verhalten, wenn ihre sichtbaren Ergebnisse textlich mit bestehenden abgeleiteten oder primären Bahnen konvergieren, ohne dass daraus falsche Distinctness oder Ownership-Verlust entsteht.

### Aufwand / Risikoprofil

- klein, primär Review-/Evidenzblock
- sehr geringer Runtime-Druck
- riskant nur dann, wenn daraus doch still neue Produkt- oder Vertragsarbeit gemacht wird

### Scope

- Nachweisführung über low-activity-thread-, persist-builder-, handoff-, workspace- und manual-update-nahe Konvergenzfälle
- Beobachtung, ob partielle manuelle Persist-Updates textlich mit vorhandenen Bahnen konvergieren können, ohne Ownership-Verlust oder künstliche Differenzbildung
- Doku-/Verifikationsnachweis enger halten als weitere Runtime-Expansion

### Nicht-Scope

- neue Prompt-, Dispatch-, Guardrail-, Resume-, Workspace-, Surface- oder Digest-Mechanik
- neue Surface-State- oder UI-Verträge
- Persistenz-/Schema-/Provider-Expansion
- breiter Misch-Commit aus dem lokalen Dirty Tree

## Alternative Valid Next Blocks

- kleiner weiterer Digest-/handoff-naher Vertragsblock, aber nur falls ein konkreter unmarkierter Wahrheitswechsel im Runtime-Pfad sichtbar wird
- gezielter Test-/Evidence-Block für weitere Guardrail-Randfälle statt neuer Runtime-Mechanik
- enger Doku-/Review-Block zur Beobachtung, ob die Guardrail-Nachspur in echten Läufen zu oft stumm oder zu oft laut bleibt
- enger Doku-/Review-Block zur Beobachtung, ob `Pre-Dispatch Crush Light` in echten Läufen die Antwortfokussierung verbessert, ohne Nebenpfade zu übersteuern
- enger Doku-/Review-Block zur Beobachtung, ob Workspace-Ziel und nächster Meilenstein in echten Läufen zu oft dieselbe Aussage wiederholen
- enger Doku-/Review-Block zur Beobachtung, ob die Hauptoberfläche zu oft denselben Signaltext in Fokus, nächstem Schritt und offenem Punkt wiederholt
- enger Doku-/Review-Block zur Beobachtung, ob Primärsignale an Fallback-Grenzen zu früh von Workspace- oder Briefing-Werten übernommen werden
- enger Doku-/Review-Block zur Beobachtung, ob ruhige Threads zu generisch oder zu implizit wirken, obwohl kein aktiver Arbeitslauf vorliegt
- enger Doku-/Review-Block zur Beobachtung, ob signalarme, aber nicht leere Threads unnötig Re-Entry- oder Open-Point-Dopplung auf die Primärfläche ziehen
- größerer Doku-/Review-Block zur Beobachtung, ob signalarme Threads über `workrun`, `handoff`, `workspace` und Primärfläche denselben kleinen Bedeutungssatz konsistent tragen
- größerer Doku-/Review-Block zur Beobachtung, ob Low-Activity-Divergenzen zwischen `workspace`, `handoff` und Primärfläche klar begrenzt bleiben statt Zwischenrauschen zu erzeugen
- größerer Doku-/Review-Block zur Beobachtung, ob manuelle Low-Activity-Wahrheit in `workrun`, `handoff` oder `workspace` nur die beabsichtigten Vorrangbahnen übernimmt
- größerer Doku-/Review-Block zur Beobachtung, wie kollidierende manuelle Low-Activity-Wahrheiten über `workrun`, `handoff` und `workspace` gegeneinander priorisiert werden
- größerer Doku-/Review-Block zur Beobachtung, wie partielle manuelle Low-Activity-Wahrheit laneweise auf `handoff`-, `briefing`- oder `workspace`-Fallbacks zurückfällt
- größerer Doku-/Review-Block zur Beobachtung, wie manuelle Low-Activity-Source-Ownership stabil bleibt, wenn sichtbare Werte zwischen `workrun`, `handoff`, `workspace` und Primärfläche konvergieren
- größerer Doku-/Review-Block zur Beobachtung, ob manuelle Source-Ownership in semantisch stabilen Low-Activity-Lagen über wiederholte Ableitungen hinweg konsistent bleibt
- größerer Doku-/Review-Block zur Beobachtung, wie partielle Persist-Updates in `workrun`, `handoff` und `workspace` fehlende Felder ergänzen, ohne stille semantische Drift zu erzeugen
- größerer Doku-/Review-Block zur Beobachtung, ob partielle Persist-Updates in `workrun`, `handoff` oder `workspace` sauber auf ihre builder-eigenen Bahnen begrenzt bleiben
- größerer Doku-/Review-Block zur Beobachtung, wie partielle Persist-Updates textlich mit bestehenden Persist- oder Primärbahnen konvergieren, ohne Ownership-Verlust oder künstliche Differenzbildung
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
