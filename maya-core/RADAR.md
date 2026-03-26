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

### Kandidat E1 — Post-Dispatch Epistemic Guardrail

- `Status`: `active`
- `Herkunft`: `web_ai_derived`, `cross_combined`, `distilled`, `maya_fit_high`, `adoption_candidate`
- `Quellen`:
  - externe Inline-Spec `Maya Governed Compression Shell — Spezifikation V2 (26.03.2026)` aus Claude-/ChatGPT-Ausarbeitung
  - `app/api/maya/chat/route.ts`
  - `lib/maya-provider-dispatch.ts`
  - `DESIGN.md`
  - `cards/meta/meta-001.json`
  - `cards/meta/meta-004.json`
- `Kernproblem`:
  - Maya-Antworten können epistemisch zu glatt wirken, obwohl Re-Entry-, STALE- und Warnlogik produktseitig schon relevant sind.
- `Kernidee`:
  - direkt nach dem bestehenden Dispatch einen kleinen Achse-B-Nachlauf fahren, der Mirror-, Overclaim- und Warning-Signale sowie einen begrenzten Freshness-Hinweis ableitet, aber response-nah bleibt und weder Prompt-Identität noch Persistenzmodell neu baut.
- `kombinierbare Teilideen`:
  - Mirror-Overlay-Gedanke aus `cards/meta/meta-001.json`
  - Freshness-Sentinel-Gedanke aus `cards/meta/meta-004.json`
  - Re-Entry-/STALE-Linie aus `DESIGN.md`
- `Widersprüche / Risiken`:
  - darf keinen zusätzlichen Vorab-LLM-Call, keinen Deep-Mode und keinen impliziten Schema- oder Memory-Umbau einschmuggeln
  - muss response- oder review-nah bleiben und darf den Surface-State-Vertrag nicht stillschweigend erweitern
- `Maya-Fit`:
  - hoch, wenn als enger Post-Dispatch-Block auf der bestehenden `/api/maya/chat`-Linie geschnitten
- `empfohlener Blockzuschnitt`:
  - nur Mirror-/Overclaim-/Warning-Patch nach `dispatchChat()` ohne neue Surface-State-Felder und ohne Memory-Lifecycle-Expansion
- `Urteil`:
  - jetzt als enger Kandidat sinnvoll, aber nicht mit UI- oder Memory-Scope zu mischen

### Kandidat E2 — Governed Compression Shell Deep

- `Status`: `parked`
- `Herkunft`: `web_ai_derived`, `distilled`, `scan_pending`, `maya_fit_low`
- `Quellen`:
  - externe Inline-Spec `Maya Governed Compression Shell — Spezifikation V2 (26.03.2026)` aus Claude-/ChatGPT-Ausarbeitung
  - `STATE.md`
  - `AGENTS.md`
  - `docs/spec-packs/products/maya/K5_RUNTIME_AXIS_DECISION_NOTE.md`
  - `lib/maya-memory-store.ts`
  - `lib/maya-surface-state.ts`
- `Kernproblem`:
  - die tiefere Shell-Idee bündelt Deep-Mode, neue Surface-Felder, Review-/Memory-Lifecycle und breitere Governor-Mechanik in einem Zug, obwohl Maya runtime-seitig weiter hybrid ist.
- `Kernidee`:
  - die breite Spec nicht verwerfen, sondern als späteren Ideenvorrat halten, falls die Achse-B-Reife, Review-Anbindung und Surface-State-Verträge später klarer und repo-näher werden.
- `kombinierbare Teilideen`:
  - spätere Review-Queue-Anbindung über bestehende Calibration-/Review-Stränge
  - spätere Memory-Metadaten-Erweiterung statt sofortiger harter Schema-Promotion
  - spätere Deep-Mode-/Lens-Ideen erst nach klarer Runtime-Reifung
- `Widersprüche / Risiken`:
  - als Gesamtpaket deutlich zu breit; es schneidet Dispatch, Memory, Review, Surface-State und Provider-/Kostenverhalten gleichzeitig an
  - impliziert mehr Achse-B-Reife, als `STATE.md` und `lib/maya-surface-state.ts` aktuell hergeben
- `Maya-Fit`:
  - niedrig als nächster Block, mittel nur als später zerlegbarer Ideenvorrat
- `empfohlener Blockzuschnitt`:
  - nicht jetzt; frühestens nach Evidenz aus engeren Vorstufen wie E1 und nur als weitere Zerlegung in eigene Miniblöcke
- `Urteil`:
  - geparkt, bis Maya dafür mehr Runtime-Reife und einen expliziten Scope-Entscheid hat

## Crossings aus dem aktuellen Scan

- `A × E1`:
  - ein später stabiler Post-Dispatch-Guardrail kann sekundäre Mirror-/Warning-Signale in Ops-Lens oder Digest speisen, ist aber kein Grund, UI-Nachschärfung und Runtime-Hardening in denselben Block zu ziehen.
- `E1 × meta-001 × meta-004`:
  - `Mirror Overlay` und `Freshness Sentinel` liefern die engste card-nahe Form für Mirror-, Warning- und Freshness-Hinweise ohne Deep-Mode oder Memory-Lifecycle-Sprung.
- `STATE`/`AGENTS` × `sol-cross-058`:
  - die Idee externer Checkpoints ist für Maya bereits materiell als `STATE.md`-/`AGENTS.md`-Anker übernommen; daraus folgt aktuell kein separater Produktblock.

## Karten-Scan-Triage

- `cards/meta/meta-001.json` und `cards/meta/meta-004.json` sind aktuell die stärksten card-basierten Inputs für einen bounded Maya-Guardrail-Kandidaten.
- `cards/solutions/sol-cross-058.json` bestätigt die Checkpoint-/External-Anchoring-Disziplin, die in `STATE.md` und `AGENTS.md` bereits materiell verankert wurde.
- `cards/meta/meta-005.json` und `cards/solutions/sol-cross-057.json` sind für Annahmen-Transparenz inhaltlich relevant, würden als direkter Maya-Block aktuell aber zu früh in Surface-State- oder Memory-Verträge drücken.
- `cards/solutions/sol-cross-053.json`, `cards/solutions/sol-cross-054.json`, `cards/solutions/sol-cross-055.json` und `cards/meta/meta-007.json` bleiben wertvoll als cross-app Governance-Material, sind für direkte Maya-Adoption aktuell aber zu breit, zu mechanismisch oder zu systemweit.

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
| Post-Dispatch Epistemic Guardrail | `active` | `web_ai_derived`, `cross_combined` | Execution / epistemic hardening | Enger Kandidat für Mirror-/Warning-/Freshness-Nachlauf auf Achse B, solange response-nah und ohne Schema-/Memory-Umbau | externe Spec `2026-03-26`, `cards/meta/meta-001.json`, `cards/meta/meta-004.json` |
| Governed Compression Shell Deep | `parked` | `web_ai_derived` | Execution / memory / surface-state | Als Gesamtpaket weiter zu breit; nur später nach enger Zerlegung und mehr Achse-B-Reife sinnvoll | Chat-Intake `2026-03-26` |

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
- ausgewählte AICOS-Cards nach expliziter Maya-Fit-Prüfung
- zukünftige blockbezogene Handoff-Dateien

### Kartenquellen mit geprüftem Maya-Bezug

- `cards/meta/meta-001.json`
- `cards/meta/meta-004.json`
- `cards/solutions/sol-cross-058.json`

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
