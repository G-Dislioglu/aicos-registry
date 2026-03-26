# RADAR

## Zweck

Diese Datei sammelt relevante Maya-Ideen, Specs, Blueprints, frühere Chat-Ableitungen und prüfbare Ansätze in einer kompakten, KI-lesbaren Radaransicht.

`RADAR.md` ist nicht die operative Ist-Wahrheit. Dafür ist `STATE.md` zuständig.

`RADAR.md` hält fest:

- welche Ansätze existieren
- wo sie liegen
- wie ihr Prüfstatus ist
- ob sie aktuell relevant, geparkt, übernommen oder verworfen sind

## Radar-Scan-Modus

`RADAR.md` ist nicht nur eine Ablage, sondern die Steuerdatei für einen kontrollierten Ideen-Scan.

Wenn neue oder ältere Materialien eingebracht werden, läuft die Arbeit in dieser Reihenfolge:

1. Scan der eingebrachten Quellen
2. Destillation der Kerngedanken
3. Cross-Combination kompatibler Ansätze
4. Maya-Fit-Prüfung gegen Produktordnung, Architekturrealität und Guardrails
5. Vorschlag eines begrenzten Adoptionspfads
6. Umsetzung nur nach expliziter Absprache mit dem Nutzer

## Update-Vertrag

Diese Datei muss aktualisiert werden, wenn:

- neue Maya-Ideen oder Specs repo-nah abgelegt werden
- ein Proposal geprüft, übernommen, geparkt oder verworfen wird
- ein externer KI-Review neue relevante Ansatzlinien liefert
- ein Ansatz aus dieser Datei in reale App-Arbeit überführt wird
- ein Scan-Lauf neue destillierte oder kombinierte Kandidaten erzeugt

## Status-Taxonomie

Verwende für Radar-Einträge bevorzugt diese Zustände:

- `active`
- `parked`
- `adopted`
- `rejected`
- `unclear`

Zusätzliche Einordnung:

- `repo_near`
- `chat_derived`
- `web_ai_derived`
- `local_note`
- `spec_pack`

Zusätzliche Prüfmarker:

- `scan_pending`
- `distilled`
- `cross_combined`
- `maya_fit_high`
- `maya_fit_medium`
- `maya_fit_low`
- `adoption_candidate`

## Nutzung

Für neue Chats oder externe Reviews:

1. `STATE.md` lesen
2. `RADAR.md` lesen
3. erst dann die jeweils relevanten Detaildokumente öffnen

Diese Datei soll helfen, gute frühere Ansätze nicht zu verlieren und trotzdem nicht versehentlich als bereits umgesetzte Produktwahrheit auszugeben.

Diese Datei steuert außerdem, wie aus verstreuten Ideen konkrete, prüfbare Maya-Kandidaten werden.

## Scan-Pipeline

### Phase 1: Intake

Mögliche Quellen für einen Scan:

- Chat-Protokolle oder Handoffs
- vorhandene `.md`-, Spec-, Blueprint- oder Proposal-Dateien
- externe KI-Ausarbeitungen
- lokale Notizen oder Review-Packs

Ziel dieser Phase ist nicht sofortige Übernahme, sondern geordnete Sichtbarkeit.

### Phase 2: Destillation

Für jede Quelle werden die wesentlichen Kernelemente herausgezogen:

- welches Problem benannt wird
- welches Zielbild vorgeschlagen wird
- welche konkreten Änderungen implizit oder explizit gemeint sind
- welche Annahmen, Risiken und Scope-Grenzen enthalten sind
- welche Teile nur Sprache sind und welche wirklich umsetzbare Struktur liefern

Das Ergebnis ist kein Volltext-Archiv, sondern ein verdichteter Radar-Kandidat.

### Phase 3: Cross-Combination

Verwandte Ideen dürfen aktiv gegeneinander und miteinander geprüft werden.

Dabei wird unterschieden zwischen:

- redundanten Ansätzen
- komplementären Ansätzen
- widersprüchlichen Ansätzen
- kombinierbaren Teilideen

Wenn zwei oder mehr Quellen zusammen einen stärkeren Kandidaten ergeben, darf ein neuer kombinierter Radar-Eintrag entstehen. Dieser muss dann aber als kombinierter Kandidat markiert werden und seine Quellen offen nennen.

### Phase 4: Maya-Fit-Prüfung

Jeder Kandidat wird gegen folgende Fragen geprüft:

- stärkt er `/maya` als primäre Companion Surface?
- passt er zur aktuellen Hybridrealität statt sie falsch zu vereinfachen?
- respektiert er die Trennung zwischen Ist-Zustand, Zielbild und proposal-only Material?
- ist er in engem Scope testbar?
- droht er unnötig Affect-, Provider-, API- oder Persistenz-Scope aufzureißen?
- lässt er sich als klarer nächster Block formulieren?

### Phase 5: Adoptionsvorschlag

Wenn ein Kandidat sinnvoll erscheint, wird nicht sofort gebaut.

Stattdessen wird festgehalten:

- empfohlener Blockname
- erwarteter Nutzen
- betroffene Dateien oder Bereiche
- Risiken
- Nicht-Scope
- ob der Kandidat jetzt, später oder gar nicht geeignet ist

### Phase 6: User Gate

Ein Radar-Kandidat wird nur in reale Maya-Core-Arbeit überführt, wenn der Nutzer dem vorgeschlagenen Block zustimmt.

Ohne diese Absprache bleibt der Kandidat Radar-Material und keine aktive Implementation.

## Maya-Fit-Matrix

Ein guter Maya-Kandidat erfüllt möglichst viele dieser Kriterien:

| Kriterium | Leitfrage |
|---|---|
| Produktfit | Macht der Ansatz `/maya` klarer, hilfreicher oder fokussierter als Companion Surface? |
| Architekturfairness | Respektiert der Ansatz die aktuelle Hybridrealität statt falsche Endzustände zu behaupten? |
| Scope-Disziplin | Bleibt der Ansatz in einem begrenzten, benennbaren Block? |
| Repo-Nähe | Lässt sich der Vorschlag auf echte Dateien, reale UI-Flächen oder vorhandene Stränge beziehen? |
| Umsetzbarkeit | Kann daraus ein konkreter, kontrollierter Arbeitsblock entstehen? |
| Guardrail-Treue | Vermeidet der Ansatz Drift bei `/chat`, Affect, API, Persistenz und proposal-only Behauptungen? |

Faustregel:

- `maya_fit_high` = klarer Kandidat für einen begrenzten nächsten Block
- `maya_fit_medium` = interessant, aber erst nach Scope-Schnitt oder weiterer Klärung
- `maya_fit_low` = eher fern, zu breit oder nicht sauber mit Maya-Core kompatibel

## Cross-Combination-Regeln

Crossing und Kombination sind ausdrücklich erlaubt, aber nur unter diesen Bedingungen:

- die Ursprungsquellen müssen benannt bleiben
- Widersprüche müssen offen markiert werden
- ein kombinierter Kandidat darf nicht stillschweigend so aussehen, als sei er aus einer einzigen Quelle gekommen
- Kombination ist nur sinnvoll, wenn sie den Kandidaten klarer, testbarer oder Maya-tauglicher macht
- reine Ideenakkumulation ohne klaren Blockzuschnitt ist zu vermeiden

## Erster Scanlauf — Destillierte Kandidaten

### Scan-Batch

- `docs/spec-packs/products/maya/BLUEPRINT.md`
- `docs/spec-packs/products/maya/STATUS.md`
- `docs/spec-packs/products/maya/CONTRACT.md`
- `docs/spec-packs/products/maya/CANON.md`
- `docs/spec-packs/products/maya/CONTINUITY.md`
- `docs/spec-packs/products/maya/EMBODIMENTS.md`
- `docs/spec-packs/products/maya/K5_RUNTIME_AXIS_DECISION_NOTE.md`
- `docs/spec-packs/products/maya/proposals/2026-03-maya-companion-surface-refresh.md`
- `DESIGN.md`
- `KERN_HANDOFF_2026-03-15.md`
- `KERN_HANDOFF_2026-03-16.md`

### Kandidat A — Focus / Re-Entry / Ops-Lens Surface Consolidation

- `Status`: `active`
- `Herkunft`: `spec_pack`, `chat_derived`, `cross_combined`, `distilled`, `maya_fit_high`, `adoption_candidate`
- `Quellen`:
  - `docs/spec-packs/products/maya/proposals/2026-03-maya-companion-surface-refresh.md`
  - `DESIGN.md`
  - `docs/spec-packs/products/maya/BLUEPRINT.md`
  - `docs/spec-packs/products/maya/STATUS.md`
- `Kernproblem`:
  - `/maya` soll Companion Surface sein, trägt aber weiter offene UX-Kanten bei Re-Entry-Trennung, sekundären Detailflächen und Lens-/Drawer-Logik.
- `Kernidee`:
  - die bereits verdichtete Fokusfläche nicht wieder groß umbauen, sondern den nächsten UI-Block auf saubere Screen-Modi, klare Re-Entry-Grenze und echte Ops-Lens-Auslagerung sekundärer Inhalte zuschneiden.
- `kombinierbare Teilideen`:
  - 4 Screen-Modi aus `DESIGN.md`
  - Lens-/Drawer-Richtung aus dem Companion-Surface-Proposal
  - offene Kanten aus `STATUS.md`
- `Widersprüche / Risiken`:
  - droht zu breit zu werden, wenn Focus, Chat, Review, Re-Entry und Lens gleichzeitig angefasst werden
  - darf nicht stillschweigend eine komplette UI-Neuarchitektur behaupten
- `Maya-Fit`:
  - hoch, wenn als enger UI-Block geschnitten
- `empfohlener Blockzuschnitt`:
  - zuerst nur Re-Entry-vs.-Tuning-Trennung und eine erste echte Ops-Lens für sekundäre Inhalte
- `Urteil`:
  - jetzt, aber nur als kleiner begrenzter UI-Block

### Kandidat B — Surface-State Axis Shift Follow-Up

- `Status`: `active`
- `Herkunft`: `spec_pack`, `distilled`, `maya_fit_medium`, `adoption_candidate`
- `Quellen`:
  - `docs/spec-packs/products/maya/K5_RUNTIME_AXIS_DECISION_NOTE.md`
  - `docs/spec-packs/products/maya/STATUS.md`
  - `docs/spec-packs/products/maya/BLUEPRINT.md`
- `Kernproblem`:
  - die sichtbare Maya-Fläche ist produktseitig klarer, aber die Runtime bleibt hybrid und der interne Leseweg hinter `/api/maya/surface-state` ist noch Übergangsadapter.
- `Kernidee`:
  - den nächsten K5-Folgeschritt als kleine interne Verschiebung definieren: nicht Big Bang, sondern gezielte Verlagerung einzelner Surface-State-Verantwortungen Richtung Achse B.
- `kombinierbare Teilideen`:
  - K5-Phasenlogik
  - Hybrid-Warnung aus `STATUS.md`
  - Primacy-Ordnung aus `BLUEPRINT.md`
- `Widersprüche / Risiken`:
  - hohes Risiko für Scope-Drift in Persistenz, Provider oder Sessionlogik
  - schlechter Kandidat, wenn gleichzeitig UI und Runtime umgebaut werden
- `Maya-Fit`:
  - mittel, technisch sinnvoll, aber aktuell schwerer und riskanter als ein enger UI- oder Doku-Block
- `empfohlener Blockzuschnitt`:
  - nur wenn wir bewusst einen K5-Folgeblock wählen; dann klein und adapternah
- `Urteil`:
  - später, nicht als nächster allgemeiner Planungsblock

### Kandidat C — Truth-Marked Continuity Transfer Contract

- `Status`: `parked`
- `Herkunft`: `spec_pack`, `cross_combined`, `distilled`, `maya_fit_medium`
- `Quellen`:
  - `docs/spec-packs/products/maya/CONTINUITY.md`
  - `docs/spec-packs/products/maya/CONTRACT.md`
  - `docs/spec-packs/products/maya/CANON.md`
  - `STATE.md`
- `Kernproblem`:
  - mehrere Dokumente verlangen strikte Trennung von Ist-Zustand, proposal-only und Raumwechseln, aber diese Logik ist vor allem als Doku- und Sprachregel sichtbar.
- `Kernidee`:
  - aus den Wahrheits- und Kontinuitätsregeln einen späteren Maya-nahen Übergangsvertrag ableiten, damit Kontextobjekte oder Digest-nahe Übergaben klarer markiert werden können.
- `kombinierbare Teilideen`:
  - Wahrheitsklassen aus `CONTRACT.md`
  - Übergangsobjekte aus `CONTINUITY.md`
  - Assistenz-/Nicht-Kanon-Haltung aus `CANON.md`
- `Widersprüche / Risiken`:
  - kann leicht zu abstrakt oder cross-app-nah werden
  - nicht als reine Theorie in aktive App-Arbeit kippen lassen
- `Maya-Fit`:
  - mittel, wertvoll als Guardrail- oder Vertragsidee, aber noch nicht automatisch der beste nächste App-Block
- `empfohlener Blockzuschnitt`:
  - zunächst nur als spätere bounded contract note oder kleiner Digest-/handoff-naher Klärungsblock
- `Urteil`:
  - später

### Kandidat D — Review / Verification Closure for Primary Maya Surfaces

- `Status`: `adopted`
- `Herkunft`: `local_note`, `chat_derived`, `cross_combined`, `distilled`, `maya_fit_high`
- `Quellen`:
  - `KERN_HANDOFF_2026-03-16.md`
  - `docs/spec-packs/products/maya/STATUS.md`
  - `STATE.md`
- `Kernproblem`:
  - der Repo- und Push-Stand ist klarer als früher, aber visuelle und orientierende Nachweise über die primären Maya-Flächen bleiben ein wiederkehrender offener Punkt.
- `Kernidee`:
  - einen kleinen Review-/Evidence-Block fahren, der die aktuelle publizierte Maya-Produktlinie knapp absichert und in der Doku sauber spiegelt.
- `kombinierbare Teilideen`:
  - Shell-/Entry-Verifikation aus dem 16.03-Handoff
  - aktueller Published-vs.-Local-Rahmen aus `STATE.md`
  - Statusklarheit aus `STATUS.md`
- `Widersprüche / Risiken`:
  - darf nicht in große Cleanup- oder Runtime-Arbeit kippen
  - nur sinnvoll, wenn wir tatsächlich noch gezielte Nachweise oder saubere Planungs-Syncs wollen
- `Maya-Fit`:
  - hoch, weil eng, risikoarm und unmittelbar repo-nah
- `empfohlener Blockzuschnitt`:
  - Doku-/Planungs-Sync plus gezielter Nachweis der primären Oberflächenlinie
- `Urteil`:
  - abgeschlossen; als enger Evidenz- und Sync-Block in die Root- und Statusdokumente übernommen

### Kandidat E — Maya Governed Compression Shell v2

- `Status`: `unclear`
- `Herkunft`: `web_ai_derived`, `distilled`, `scan_pending`, `maya_fit_medium`
- `Quellen`:
  - externe Inline-Spec `Maya Governed Compression Shell — Spezifikation V2 (26.03.2026)` aus Claude-/ChatGPT-Ausarbeitung
  - `STATE.md`
  - `AGENTS.md`
  - `docs/spec-packs/products/maya/K5_RUNTIME_AXIS_DECISION_NOTE.md`
  - `app/api/maya/chat/route.ts`
  - `lib/maya-provider-dispatch.ts`
  - `lib/maya-memory-store.ts`
  - `lib/maya-surface-state.ts`
- `Kernproblem`:
  - Maya soll epistemisch härter, fokussierter und weniger overclaim-lastig werden, aber die aktuelle Runtime ist hybrid und die Spec schlägt eine breite Governor-Schicht vor, die Dispatch, Memory, Review und Surface-State gleichzeitig berührt.
- `Kernidee`:
  - eine vorgeschaltete und nachgelagerte Governed-Compression-Schale um `/api/maya/chat` legen, die Kernspannung komprimiert, Antworten spiegelt, Annahmen/Warnungen ableitet und daraus begrenzte Surface-/Memory-Signale erzeugt, ohne Mayas Identität oder Prompt-Contract vollständig neu zu bauen.
- `kombinierbare Teilideen`:
  - Pre-/Post-Flight-Hardening auf Achse B rund um `app/api/maya/chat/route.ts`
  - Annahmen-/Freshness-Signale passend zur Re-Entry- und STALE-Linie in `DESIGN.md`
  - Review-Queue-Anschluss über bestehende Review-/Calibration-Stränge statt neues Review-Subsystem
  - Kosten-/Fail-Safe-Denken passend zu bestehendem Cost Guard und Provider Registry
  - Memory-Metadaten eher als Erweiterung von `metaJson` statt sofortige harte Schema-Promotion quer durch den Stack
- `Widersprüche / Risiken`:
  - als Gesamtpaket deutlich zu breit für einen einzelnen K2-Block; es schneidet Execution, Provider-Orchestrierung, Message-Persistenz, Memory-Lifecycle, Review-Queue und Surface-State gleichzeitig an
  - die Spec behauptet implizit mehr Achse-B-Reife als aktuell repo-sichtbar ist; `lib/maya-surface-state.ts` hängt noch an Achse A und die Runtime ist laut `STATE.md` ausdrücklich hybrid
  - vorgeschlagene neue Kernfelder wie `core_tension`, `open_assumptions`, `reasoning_mode` oder `last_pressure_reaction` haben aktuell keinen realen Platz im Surface-State-Vertrag
  - der vorgeschlagene Memory-Lifecycle kollidiert konzeptionell mit bestehenden `MemoryEntry`-/Tier-/`reviewStatus`-Strukturen und wäre kein bloßer Middleware-Schnitt mehr
  - Deep-Mode mit Linsen, Resonanz und adversarial Recheck droht Provider-/Kosten-/Latenz-Scope massiv zu erweitern und verletzt die aktuelle Scope-Disziplin, wenn er als ein Block gelesen wird
  - Teile der Spec sind stark als Denkstil formuliert, aber noch nicht sauber in repo-nahe, testbare Minimalbausteine zerlegt
- `Maya-Fit`:
  - mittel als Ideenvorrat und Guardrail-Richtung; niedrig als sofortiger Komplettblock
- `empfohlener Blockzuschnitt`:
  - nicht als Volladoption
  - wenn überhaupt, zuerst nur ein enger K5-/Execution-Block: Post-Dispatch Mirror-/Overclaim-/Warning-Patch ohne Memory-Schema-Umbau und ohne Deep-Mode
  - alternativ ein Doku-/Proposal-Block, der nur die komprimierbaren Teilideen in Maya-kompatible Miniblöcke zerlegt
- `Urteil`:
  - interessant, aber aktuell nur als zerlegter Kandidat; nicht jetzt als vollständiger Implementierungsblock

## Historische Quellen-Triage aus dem ersten Scan

- `KERN_HANDOFF_2026-03-15.md`
  - enthält wichtige historische Problemachsen, ist aber in Teilen überholt oder bereits später absorbiert
- `KERN_HANDOFF_2026-03-16.md`
  - bleibt als repo-nahe Zwischenkonsolidierung nützlich, ist aber nicht mehr die alleinige aktuelle Leitdatei
- `docs/spec-packs/products/maya/proposals/2026-03-maya-companion-surface-refresh.md`
  - bleibt stark, aber nur teilweise bereits in reale UI-Linie übersetzt; deshalb weiter `parked` bzw. nur in Teilblöcken übernehmen
- `DESIGN.md`
  - liefert starke UI- und Screen-Modus-Regeln, darf aber nicht automatisch als Nachweis produktiver Vollumsetzung gelesen werden

## Aktuell relevante Radar-Einträge

| Titel | Status | Herkunft | Bereich | Kurzurteil | Quelle |
|---|---|---|---|---|---|
| Maya Companion Surface Refresh | `parked` | `spec_pack` | UI / Produktführung | Weiterhin wertvoll als größere UI-Zielrichtung, aber nicht automatische aktuelle Produktwahrheit | `docs/spec-packs/products/maya/proposals/2026-03-maya-companion-surface-refresh.md` |
| Maya UI Trilogy Release Closure | `adopted` | `chat_derived` | UI / Oberflächenhierarchie | Als reale veröffentlichte UI-Linie jetzt Teil der publizierten Maya-Wahrheit | Commits `9a53ac8`, `a95068f`, `ed10c06` |
| Continuity Truth Audit | `adopted` | `chat_derived` | Continuity / Digest | Hat geklärt, dass `lib/maya-thread-digest.ts` der aktive Kern ist und lokale Residual-UI-Dateien nicht automatisch Produktwahrheit sind | lokaler Audit-Befund, anschließend in `STATE.md` verdichtet |
| Maya Planning Entry Sync | `adopted` | `chat_derived` | Planung / Repo-Orientierung | `README.md` und `AGENTS.md` wurden auf `STATE.md` und `RADAR.md` als Einstiegsschicht ausgerichtet | `STATE.md`, `README.md`, `AGENTS.md` |
| Primary Maya Surface Evidence Closure | `adopted` | `chat_derived` | Evidenz / Produktordnung | Die repo-sichtbare Rahmung von `/`, `/maya` und `/chat` wurde belegt und in den Zustandsdokumenten nachgezogen | `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Focus / Re-Entry / Ops-Lens Surface Consolidation | `adopted` | `chat_derived` | UI / Hauptflächenfokus | Arbeitsraum- und Thread-Steuerung wurden als sekundäre Lens aus dem Primärfluss der Maya-Hauptfläche herausgezogen | `STATE.md`, `components/maya-chat-screen.tsx`, `components/maya/maya-ops-lens.tsx` |
| Active Workrun Detail Downshift | `adopted` | `chat_derived` | UI / Arbeitslauf-Fokus | Manuelle Arbeitslauf-Steuerung, Handoff-Details und Checkpoint-Pflege wurden aus der Primärfläche in die Ops-Lens verlagert | `STATE.md`, `components/maya/maya-active-workrun-panel.tsx`, `components/maya/maya-workrun-details.tsx` |
| Maya Governed Compression Shell v2 | `unclear` | `web_ai_derived` | Execution / epistemic hardening | Starker Denkrahmen, aber als direkter Maya-Core-Block aktuell zu breit und nur nach enger Zerlegung architekturfair | Chat-Intake `2026-03-26` |

## Proposal- und Ideenquellen

### Repo-nahe Maya-Quellen

- `docs/spec-packs/products/maya/BLUEPRINT.md`
- `docs/spec-packs/products/maya/STATUS.md`
- `docs/spec-packs/products/maya/CANON.md`
- `docs/spec-packs/products/maya/CONTINUITY.md`
- `docs/spec-packs/products/maya/CONTRACT.md`
- `docs/spec-packs/products/maya/EMBODIMENTS.md`
- `docs/spec-packs/products/maya/K5_RUNTIME_AXIS_DECISION_NOTE.md`
- `docs/spec-packs/products/maya/proposals/2026-03-maya-companion-surface-refresh.md`
- `DESIGN.md`
- `KERN_HANDOFF_2026-03-15.md`
- `KERN_HANDOFF_2026-03-16.md`

### Typische externe oder chatbasierte Quellen

- frühere Claude-/ChatGPT-Ausarbeitungen
- lokale Handoffs oder Notizen
- Review-Packs wie `maya-core-review-pack__current.zip`
- zukünftige blockbezogene Handoff-Dateien

## Aufnahme-Regeln für neue Radar-Einträge

Ein neuer Eintrag soll mindestens enthalten:

- Titel
- Status
- Herkunft
- betroffener Bereich
- 1-Satz-Kurzurteil
- Pfad oder Verweis auf die Detailquelle
- Maya-Fit-Einschätzung

Wenn ein Ansatz geprüft wird, zusätzlich festhalten:

- warum er relevant ist
- warum er noch nicht übernommen wurde
- ob er der nächste Block sein sollte oder bewusst nicht jetzt
- ob er aus einer Einzelquelle oder einer Cross-Combination stammt
- welche Guardrails besonders berührt werden

## Destillationsformat für neue Scan-Kandidaten

Wenn neue Materialien eingescannt werden, soll die Verdichtung bevorzugt in diesem Format in `RADAR.md` landen:

- `Titel`
- `Quellen`
- `Kernproblem`
- `Kernidee`
- `kombinierbare Teilideen`
- `Widersprüche / Risiken`
- `Maya-Fit`
- `empfohlener Blockzuschnitt`
- `Urteil`: jetzt / später / nein

## Adoption-Regeln

Ein Radar-Eintrag darf nur dann auf `adopted` wechseln, wenn mindestens eines davon klar belegt ist:

- reale Repo-Änderung vorhanden
- Commit-/Push-Linie vorhanden
- oder `STATE.md` führt ihn explizit als Teil der aktuellen Wahrheit

Ein Eintrag darf nicht stillschweigend von `parked` oder `active` nach `adopted` wandern.

Zusätzlich gilt:

- vor Adoption muss der Kandidat als begrenzter Maya-Block formuliert sein
- vor Adoption muss die Maya-Fit-Prüfung sichtbar sein
- vor Adoption muss die Umsetzung mit dem Nutzer abgesprochen sein

## Nicht-Ziele

`RADAR.md` ist nicht dafür da,

- die komplette Architekturwahrheit zu ersetzen
- Implementation-Details vollständig auszubreiten
- proposal-only Material als bereits gebaut darzustellen
- den gesamten Dirty Tree zu inventarisieren
- jede interessante Idee automatisch in aktive Arbeit zu verwandeln

## Nächste sinnvolle Pflege

- ältere relevante Maya-Diskussionen, Specs und externe KI-Ausarbeitungen schrittweise als Radar-Einträge nachziehen
- für besonders wichtige Ideen später eigene Detaildateien oder einen Unterordner ergänzen, falls `RADAR.md` zu dicht wird
- bei jeder größeren Maya-Entscheidung prüfen, ob ein Radar-Eintrag auf `active`, `parked`, `adopted` oder `rejected` umgestellt werden muss
- für neue Quellen gezielt Scan-Läufe fahren, Kernelemente destillieren und nur Maya-taugliche Kandidaten als mögliche Blöcke vorschlagen
