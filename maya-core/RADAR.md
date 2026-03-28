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
2. Kompression der Kerngedanken
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
- ein Scan-Lauf neue komprimierte oder kombinierte Kandidaten erzeugt

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

Truth Classes:

- `proposal_only`
- `repo_visible`
- `local_only`
- `derived_from_external_review`

Typische `next_gate`-Werte:

- `scan`
- `narrow_scope`
- `proposal`
- `user_approval`
- `archive`

Zusätzliche Prüfmarker:

- `scan_pending`
- `distilled`
- `cross_combined`
- `compression_tested`
- `crossing_derived`
- `gap_identified`
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

### Phase 2: Kompression (nicht Destillation)

Für jede Quelle wird nicht zusammengefasst, sondern zerquetscht.

Die Leitfrage ist NICHT "Was ist die Essenz?" sondern:

**"Was an dieser Idee kannst du nicht wegstreichen, egal wie du es versuchst?"**

Fünf Streichversuche pro Quelle:

1. Varianten streichen: Was bleibt egal wie man die Idee formuliert?
2. Harmonie streichen: Wo ist der Widerspruch der sich nicht auflösen lässt?
3. Nebenschauplätze streichen: Was blockiert alles andere?
4. Negation: Was ist diese Idee definitiv NICHT?
5. Kategorie streichen: Ist die Schublade selbst fragwürdig?

Das Ergebnis ist kein sauberes Summary, sondern ein komprimierter Kern mit Spannung.

Wenn das Ergebnis sich elegant und rund anfühlt, wurde destilliert statt komprimiert. Nochmal.

Kompressionsformat pro Kandidat:
 
- `Unzerstörbarer Kern` (1-2 Sätze, muss Spannung enthalten)
- `Exponierte Annahmen` (was wurde beim Komprimieren sichtbar?)
- `Weggeworfen` (was konnte erfolgreich gestrichen werden?)

Optional bei verdächtig glatten, chat-abgeleiteten oder scope-unklaren Ansätzen:

- kleiner `compression_check` nach `docs/methods/compression-check.md`, wenn er echte Schärfung bringt statt nur neue Ritualform

### Phase 3: Cross-Combination

Verwandte Ideen dürfen aktiv gegeneinander und miteinander geprüft werden.

Dabei wird unterschieden zwischen:

- redundanten Ansätzen
- komplementären Ansätzen
- widersprüchlichen Ansätzen
- kombinierbaren Teilideen

Wenn zwei oder mehr Quellen zusammen einen stärkeren Kandidaten ergeben, darf ein neuer kombinierter Radar-Eintrag entstehen. Dieser muss dann aber als kombinierter Kandidat markiert werden und seine Quellen offen nennen.

### Crossing-Herkunft (aus AICOS übernommen)

Jeder Kandidat, der aus einem Crossing entsteht, muss ein Feld tragen:

- `crossing_origin`: Welche konkreten Kandidaten oder Quellen wurden gekreuzt?
  Nicht lose Quellensammlung, sondern präzise Paare wie `A × E2` oder `DESIGN.md × meta-004`.

### Theme-Cluster vor Crossing (aus AICOS übernommen)

Bevor Kandidaten gekreuzt werden, zuerst nach Themen clustern:

- UI / Surface
- Execution / Runtime
- Memory / Continuity
- Governance / Epistemic
- Planung / Doku

Dann kreuzen:

- innerhalb desselben Clusters
- zwischen Clustern

### Lücken-Erkennung (aus AICOS übernommen)

Nach jedem Scan-Lauf explizit dokumentieren:

**Was fehlt?** — Welche Bereiche haben keinen aktiven Kandidaten?
**Was ist überrepräsentiert?** — Wo gibt es zu viele ähnliche Kandidaten?

Lücken werden als eigener Abschnitt in `RADAR.md` geführt.

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

Optional bei nicht-trivialen Crossings mit spürbarer Affinität, aber unklarem Hebel:

- kleiner relationaler Gegencheck nach `docs/methods/relational-selection-check.md`
- dabei mindestens `affinity_reason`, `anti_affinity_reason`, `truth_mix_risk`, `fake_risk` und `why_not_more` knapp festhalten
- der Check ergänzt Crossing und Maya-Fit, ersetzt sie aber nicht

Crossing-Guardrail:

- ein Crossing darf nur dann `maya_fit_high` tragen, wenn ein konkreter Blockname existiert, betroffene Dateien oder Bereiche benannt sind, Nicht-Scope klar ist und der Kandidat als nächster Block in einem Satz formulierbar bleibt
- fehlt Blockzuschnitt oder betroffene Dateien/Bereiche, muss der Crossing-Kandidat automatisch `scan_pending` tragen und darf kein `maya_fit_high` beanspruchen

## Erster Scanlauf — Komprimierte Kandidaten

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

- `Status`: `adopted`
- `truth_class`: `repo_visible`
- `Herkunft`: `spec_pack`, `chat_derived`, `cross_combined`, `distilled`, `maya_fit_high`, `adoption_candidate`
- `Quellen`:
  - `docs/spec-packs/products/maya/proposals/2026-03-maya-companion-surface-refresh.md`
  - `DESIGN.md`
  - `docs/spec-packs/products/maya/BLUEPRINT.md`
  - `docs/spec-packs/products/maya/STATUS.md`
- `Unzerstörbarer Kern`:
  - `/maya` gewinnt nicht durch einen Totalumbau, sondern durch strikte Primärflächen-Fokussierung plus echte Auslagerung sekundärer Re-Entry- und Ops-Inhalte.
- `Exponierte Annahmen`:
  - ein enger UI-Zuschnitt reicht aus, um Fokusgewinn zu erzeugen, ohne `/chat` wieder aufzuwerten oder eine Vollneuarchitektur zu behaupten.
- `Weggeworfen`:
  - kompletter UI-Reboot, gleichrangige Hauptflächenordnung zwischen `/maya` und `/chat`, große Lens-/Review-Gesamterneuerung.
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
- `absorbed_into`:
  - `block`: `Focus / Re-Entry / Ops-Lens Surface Consolidation`
  - `files`: `components/maya-chat-screen.tsx`, `components/maya/maya-ops-lens.tsx`, `components/maya/maya-workrun-details.tsx`
  - `commit`: siehe veröffentlichte UI-Verdichtungslinie in `STATE.md`
- `next_gate`: `archive`
- `Urteil`:
  - als enger UI-Pfad übernommen; Ops-Lens-Auslagerung, Workrun-Downshift und Handoff-Prominenz-Nachschärfung sind repo-sichtbar umgesetzt

### Kandidat B — Surface-State Axis Shift Follow-Up

- `Status`: `adopted`
- `truth_class`: `local_only`
- `Herkunft`: `spec_pack`, `distilled`, `maya_fit_medium`, `adoption_candidate`
- `Quellen`:
  - `docs/spec-packs/products/maya/K5_RUNTIME_AXIS_DECISION_NOTE.md`
  - `docs/spec-packs/products/maya/STATUS.md`
  - `docs/spec-packs/products/maya/BLUEPRINT.md`
- `Unzerstörbarer Kern`:
  - Wenn die Surface-State-Naht hybrid bleibt, ruht die sichtbare Maya-Klarheit auf Übergangsadapter-Schuld; ohne kleinen Achse-B-Folgeschritt kippt die Produktordnung still zurück in Runtime-Unschärfe.
- `Exponierte Annahmen`:
  - einzelne Verantwortungen lassen sich Richtung Achse B verschieben, ohne sofort Provider-, Persistenz- oder Sessionlogik breit mitzubewegen.
- `Weggeworfen`:
  - Big-Bang-Runtime-Umbau, gleichzeitiger UI- und Adapter-Neuschnitt, implizite Behauptung einer schon abgeschlossenen Ein-Achsen-Architektur.
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
- `absorbed_into`:
  - `block`: `Surface-State Axis Shift Follow-Up`
  - `files`: `lib/maya-surface-state.ts`, `components/maya-chat-screen.tsx`, `STATE.md`, `RADAR.md`, `docs/spec-packs/products/maya/STATUS.md`
  - `commit`: `local_only`
- `next_gate`: `archive`
- `Urteil`:
  - lokal als enger K5-Vertragsblock übernommen; die Surface-State-Naht gibt jetzt nur noch schmale Session-/Workspace-Anker plus die abgeleitete Oberfläche zurück, ohne UI- oder Persistenz-Scope mitzubewegen

### Kandidat C — Truth-Marked Continuity Transfer Contract

- `Status`: `adopted`
- `truth_class`: `local_only`
- `Herkunft`: `spec_pack`, `cross_combined`, `distilled`, `maya_fit_high`
- `Quellen`:
  - `docs/spec-packs/products/maya/CONTINUITY.md`
  - `docs/spec-packs/products/maya/CONTRACT.md`
  - `docs/spec-packs/products/maya/CANON.md`
  - `STATE.md`
- `Unzerstörbarer Kern`:
  - Wenn Wahrheitswechsel und Übergaben unmarkiert bleiben, rutschen Digest-, Handoff- und Kontextobjekte still von Arbeitshilfe zu scheinbarer Produktwahrheit.
- `Exponierte Annahmen`:
  - die Doku-Regeln zu Wahrheit, Vertrag und Nicht-Kanon lassen sich später als enger Maya-naher Übergangsvertrag bündeln, ohne sofort ein großes Cross-App-System zu bauen.
- `Weggeworfen`:
  - sofortige Governor-/Contract-Plattform, systemweite Truth-Orchestrierung, abstrakte Volltheorie ohne bounded Maya-Block.
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
  - hoch, wenn als einzelner Digest-/Kontinuitätsvertrag an der bestehenden `lib/maya-thread-digest.ts`-Naht umgesetzt
- `empfohlener Blockzuschnitt`:
  - kleiner Digest-naher Vertragsblock, der stale `session.digest`-Zustände nicht mehr still als aktiven Kontinuitätsstand übernimmt
- `absorbed_into`:
  - `block`: `Truth-Marked Continuity Transfer Contract`
  - `files`: `lib/maya-thread-digest.ts`, `__tests__/lib/maya-thread-digest.test.ts`, `STATE.md`, `RADAR.md`, `docs/spec-packs/products/maya/STATUS.md`
  - `commit`: `local_only`
- `next_gate`: `archive`
- `Urteil`:
  - lokal als enger Vertragsblock übernommen; ein `session.digest` mit `needsRefresh` wird nicht mehr still als aktueller Kontinuitätsstand benutzt, sondern fällt auf laufzeitnahen Session-Kontext zurück, ohne UI-, Provider- oder Persistenzverträge zu erweitern

### Kandidat D — Review / Verification Closure for Primary Maya Surfaces

- `Status`: `adopted`
- `truth_class`: `repo_visible`
- `Herkunft`: `local_note`, `chat_derived`, `cross_combined`, `distilled`, `maya_fit_high`
- `Quellen`:
  - `KERN_HANDOFF_2026-03-16.md`
  - `docs/spec-packs/products/maya/STATUS.md`
  - `STATE.md`
- `Unzerstörbarer Kern`:
  - die publizierte Maya-Linie braucht wiederkehrend kleine Evidenz- und Sync-Blöcke, damit veröffentlichte Wahrheit, Review-Lesepfad und Doku-Anker nicht auseinanderlaufen.
- `Exponierte Annahmen`:
  - ein enger Review-/Verification-Block kann Drift wirksam senken, ohne dadurch automatisch neue Runtime- oder Produktarbeit auszulösen.
- `Weggeworfen`:
  - breiter Cleanup, implizite UI-Neuplanung, Vermischung von Evidenzpflege mit größerer App-Refactor-Arbeit.
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
- `absorbed_into`:
  - `block`: `Review / Verification Closure for Primary Maya Surfaces`
  - `files`: `README.md`, `AGENTS.md`, `docs/spec-packs/products/maya/STATUS.md`
  - `commit`: repo-sichtbar über die nachgezogenen Doku-Syncs, nicht auf einen einzelnen UI-Commit reduziert
- `next_gate`: `archive`
- `Urteil`:
  - abgeschlossen; als enger Evidenz- und Sync-Block in die Root- und Statusdokumente übernommen

### Kandidat E1 — Post-Dispatch Epistemic Guardrail

- `Status`: `adopted`
- `truth_class`: `repo_visible`
- `Herkunft`: `web_ai_derived`, `cross_combined`, `distilled`, `compression_tested`, `maya_fit_high`, `adoption_candidate`
- `Quellen`:
  - externe Inline-Spec `Maya Governed Compression Shell — Spezifikation V2 (26.03.2026)` aus Claude-/ChatGPT-Ausarbeitung
  - `app/api/maya/chat/route.ts`
  - `lib/maya-provider-dispatch.ts`
  - `DESIGN.md`
  - `cards/meta/meta-001.json`
  - `cards/meta/meta-004.json`
- `Unzerstörbarer Kern`:
  - Wenn Maya erst nach dem Dispatch kurz gegen Mirror, Overclaim und Freshness gespiegelt wird, entsteht sofort mehr epistemische Disziplin, ohne Prompt-, Memory- oder Surface-State-Verträge aufzureißen.
- `Exponierte Annahmen`:
  - Ein heuristischer Nachlauf reicht als erste Schutzschicht aus, solange er eng bleibt und keine implizite Governor-Plattform behauptet.
- `Weggeworfen`:
  - Deep-Mode, Vorab-Call, Memory-Lifecycle und jede Form von Deep-Orchestrierung.
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
- `absorbed_into`:
  - `block`: `Guardrail Signal Calibration`
  - `files`: `app/api/maya/chat/route.ts`, `components/maya-chat-screen.tsx`, `components/maya/maya-workrun-details.tsx`
  - `commit`: `9bdaa3a`
- `next_gate`: `archive`
- `Urteil`:
  - als enger Achse-B-Block übernommen; der API-Nachlauf ist repo-sichtbar implementiert und die sekundäre Lens-Anzeige blieb in einem separaten UI-Folgeblock

### Kandidat E2 — Pre-Dispatch Crush Light

- `Status`: `adopted`
- `truth_class`: `local_only`
- `Herkunft`: `web_ai_derived`, `compression_tested`, `scan_pending`, `maya_fit_high`, `adoption_candidate`
- `Quellen`:
  - externe Inline-Spec `Maya Governed Compression Shell — Spezifikation V2 (26.03.2026)` aus Claude-/ChatGPT-Ausarbeitung
  - `app/api/maya/chat/route.ts`
  - `lib/maya-provider-dispatch.ts`
  - `DESIGN.md`
- `Unzerstörbarer Kern`:
  - Wenn vor `dispatchChat()` kein enger Kernzugriff passiert, optimiert Maya weiter auf die Erzählung des Problems statt auf dessen Spannung; dann kommt jede spätere Guardrail-Schicht zu spät.
- `Exponierte Annahmen`:
  - Ein einziger leichter Vorab-Call oder enges Prompt-Fragment kann genug Mehrwert liefern, ohne sofort neue Runtime-Achsen oder UI-Verträge zu erzeugen.
- `Weggeworfen`:
  - Voller Governor, zusätzliche Surface-State-Felder, Memory-Lifecycle und jede Form von Deep-Orchestrierung.
- `Kernproblem`:
  - Maya verarbeitet User-Input aktuell ohne vorgelagerte Prüfung, ob das beschriebene Problem bereits die eigentliche Kernspannung trifft.
- `Kernidee`:
  - ein einziger leichtgewichtiger Crush-Light-Schritt vor `dispatchChat()`, der die Frage beantwortet, was am Problem nicht wegstreichbar ist; das Ergebnis könnte als enger `core_tension`-Input in den bestehenden Kontextfluss eingehen.
- `kombinierbare Teilideen`:
  - Kompressionsfrage aus der Governed-Compression-Shell-Spec
  - bestehender `enrichedContext`-/Dispatch-Einstieg
  - Fokus- und Re-Entry-Linie aus `DESIGN.md`
- `Widersprüche / Risiken`:
  - zusätzlicher Vorab-Call wäre ein echter Runtime-Eingriff und muss strikt budgetiert und abschaltbar bleiben
  - darf nicht stillschweigend einen neuen Schema-, Memory- oder Surface-State-Vertrag einschmuggeln
- `Maya-Fit`:
  - hoch, wenn als einzelner, abschaltbarer Vorab-Schritt ohne Nebenachsen gebaut
- `empfohlener Blockzuschnitt`:
  - kleine Hilfsdatei für Crush-Light-Logik und enge Einhängung unmittelbar vor `dispatchChat()` ohne UI-Patch
- `absorbed_into`:
  - `block`: `Pre-Dispatch Crush Light`
  - `files`: `lib/maya-provider-dispatch.ts`, `__tests__/lib/maya-provider-dispatch.test.ts`, `STATE.md`, `RADAR.md`, `docs/spec-packs/products/maya/STATUS.md`
  - `commit`: `local_only`
- `next_gate`: `archive`
- `Urteil`:
  - lokal als enger Achse-B-Miniblock übernommen; der Dispatch-Pfad markiert jetzt vor dem Provider-Call den nicht wegstreichbaren Kern der letzten User-Nachricht, ohne UI-, Memory- oder Surface-State-Verträge zu verbreitern

### Kandidat E3 — Governed Compression Shell Deep

- `Status`: `parked`
- `truth_class`: `derived_from_external_review`
- `Herkunft`: `web_ai_derived`, `compression_tested`, `scan_pending`, `maya_fit_low`
- `Quellen`:
  - externe Inline-Spec `Maya Governed Compression Shell — Spezifikation V2 (26.03.2026)` aus Claude-/ChatGPT-Ausarbeitung
  - `STATE.md`
  - `AGENTS.md`
  - `docs/spec-packs/products/maya/K5_RUNTIME_AXIS_DECISION_NOTE.md`
  - `lib/maya-memory-store.ts`
  - `lib/maya-surface-state.ts`
- `Unzerstörbarer Kern`:
  - Die tiefe Shell-Idee will nicht nur bessere Antworten, sondern einen governeten Denk- und Review-Kreislauf; genau deshalb ist sie als Gesamtpaket für Maya im Moment zu breit.
- `Exponierte Annahmen`:
  - Sie setzt mehr Achse-B-Reife, mehr Budget- und Review-Steuerung sowie explizitere Memory-/Surface-State-Verträge voraus, als Maya aktuell belastbar hat.
- `Weggeworfen`:
  - Sofortige Vollintegration von Resonanz-Detektor, adversarial Recheck, Review-Queue und Memory-Lifecycle.
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
  - nicht jetzt; frühestens nach Evidenz aus engeren Vorstufen wie E1 und E2 und nur als weitere Zerlegung in eigene Miniblöcke
- `absorbed_into`: `none`
- `next_gate`: `archive`
- `Urteil`:
  - geparkt, bis Maya dafür mehr Runtime-Reife und einen expliziten Scope-Entscheid hat

## Dokumentierte Crossings

### Crossing 1: Kandidat A × Kandidat E2

- `crossing_origin`: ["Kandidat A (Focus / Re-Entry / Ops-Lens Surface Consolidation)", "Kandidat E2 (Pre-Dispatch Crush Light)"]
- `Hypothese`:
  - Wenn der aktive Surface-Fokus nicht aus dem rohen User-Input, sondern aus einem komprimierten Kern abgeleitet wird, kann die Primärfläche schärfer bleiben, ohne einen separaten UI-Rebuild zu verlangen.
- `empfohlener Blockzuschnitt`:
  - `Pre-Dispatch Crush Light` als enger Vorab-Block vor `dispatchChat()` mit konsumierbarem Fokusinput für die bestehende Maya-Oberfläche
- `betroffene Dateien/Bereiche`:
  - `app/api/maya/chat/route.ts`, `lib/maya-provider-dispatch.ts`, `components/maya-chat-screen.tsx`
- `Status`: `scan_pending`
- `Maya-Fit`:
  - potenziell hoch, weil E2 einen engeren Fokusinput liefern könnte, den die vorhandene Surface-Linie konsumiert

### Crossing 2: Kandidat B × Kandidat E1

- `crossing_origin`: ["Kandidat B (Surface-State Axis Shift Follow-Up)", "Kandidat E1 (Post-Dispatch Epistemic Guardrail)"]
- `Hypothese`:
  - Der post-dispatch Guardrail war ein natürlicher erster Achse-B-naher Ausführungsblock; daraus folgt, dass weitere kleine Achse-B-Schritte eher dort anschließen sollten als an breiten UI-Umbauten.
- `empfohlener Blockzuschnitt`:
  - kleiner Surface-State-Achse-B-Folgeblock an der bestehenden `/api/maya/surface-state`-Linie statt neuer UI-Ausbauphase
- `betroffene Dateien/Bereiche`:
  - `app/maya/page.tsx`, `app/api/maya/surface-state`, Surface-State-Adapter-/Runtime-Linie
- `Status`: `crossing_derived`
- `Maya-Fit`:
  - mittel bis hoch als Planungslogik; technisch sinnvoll, aber nur wenn bewusst Runtime- statt UI-Scope gewählt wird

### Crossing 3: Kandidat E1 × `meta-001` × `meta-004`

- `crossing_origin`: ["Kandidat E1 (Post-Dispatch Epistemic Guardrail)", "cards/meta/meta-001.json", "cards/meta/meta-004.json"]
- `Hypothese`:
  - `Mirror Overlay` und `Freshness Sentinel` liefern die card-nahe Form für Mirror-, Warning- und Freshness-Hinweise; Maya kann diese Struktur heuristisch übernehmen, ohne das volle AICOS-Governance-Paket zu importieren.
- `empfohlener Blockzuschnitt`:
  - enger heuristischer Nachlauf nur für Mirror-, Warning- und Freshness-Signale auf der bestehenden Maya-Chat-Linie
- `betroffene Dateien/Bereiche`:
  - `app/api/maya/chat/route.ts`, `components/maya-chat-screen.tsx`, `components/maya/maya-workrun-details.tsx`
- `Status`: `crossing_derived`
- `Maya-Fit`:
  - hoch für bounded Guardrail-Blöcke, niedrig für eine systemweite Governor-Promotion

### Crossing 4: `STATE.md` / `AGENTS.md` × `sol-cross-058`

- `crossing_origin`: ["STATE.md", "AGENTS.md", "cards/solutions/sol-cross-058.json"]
- `Hypothese`:
  - Die Idee externer Checkpoints ist für Maya bereits materiell über `STATE.md` und `AGENTS.md` aufgenommen; daraus folgt aktuell kein separater Produktblock, aber ein stabiles Review-Ankerprinzip.
- `empfohlener Blockzuschnitt`:
  - enger Doku-Sync für External-Review-Anker und Post-Push-Kontextdisziplin
- `betroffene Dateien/Bereiche`:
  - `STATE.md`, `AGENTS.md`
- `Status`: `crossing_derived`
- `Maya-Fit`:
  - hoch als Doku- und Review-Disziplin, niedrig als neuer Produktblock

## Erkannte Lücken

| Bereich | Lücke | Priorität |
|---|---|---|
| Memory / Lifecycle | Kein enger Maya-Kandidat für Stale-/Archiv-Logik im Maya-eigenen Memory | mittel |
| Governance / Freshness | Kein separater Kandidat prüft wiederverwendeten Kontext systematisch auf Aktualität außerhalb des post-dispatch Heuristikfensters | mittel |
| Testing / Verification | Kein enger Kandidat für automatisierte Verifikation einer möglichen Governor-Einführung | niedrig |

## Karten-Scan-Triage

- `cards/meta/meta-001.json` und `cards/meta/meta-004.json` sind aktuell die stärksten card-basierten Inputs für einen bounded Maya-Guardrail-Kandidaten.
- `cards/solutions/sol-cross-013.json` ist das präziseste AICOS-Strukturvorbild für explizites Crossing zwischen Mirror, Freshness und Regime-Exit; für Maya ist davon aktuell nur der Mirror-/Freshness-Slice direkt anschlussfähig.
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
| Truth-Marked Continuity Transfer Contract | `parked` | `spec_pack`, `cross_combined` | Continuity / Vertragsgrenzen | Wertvoll als spätere Klärungslinie, aktuell aber zu abstrakt für den engsten nächsten Block | `docs/spec-packs/products/maya/CONTINUITY.md`, `docs/spec-packs/products/maya/CONTRACT.md`, `STATE.md` |
| Governed Compression Shell Deep | `parked` | `web_ai_derived`, `compression_tested` | Execution / memory / surface-state | Als Gesamtpaket weiter zu breit; nur später nach enger Zerlegung und mehr Achse-B-Reife sinnvoll | Chat-Intake `2026-03-26` |

## Abgeschlossene Radar-Einträge

| Titel | Status | Herkunft | Bereich | Kurzurteil | Quelle |
|---|---|---|---|---|---|
| Maya UI Trilogy Release Closure | `adopted` | `chat_derived` | UI / Oberflächenhierarchie | Als reale veröffentlichte UI-Linie jetzt Teil der publizierten Maya-Wahrheit | Commits `9a53ac8`, `a95068f`, `ed10c06` |
| Continuity Truth Audit | `adopted` | `chat_derived` | Continuity / Digest | Hat geklärt, dass `lib/maya-thread-digest.ts` der aktive Kern ist und lokale Residual-UI-Dateien nicht automatisch Produktwahrheit sind | lokaler Audit-Befund, anschließend in `STATE.md` verdichtet |
| Maya Planning Entry Sync | `adopted` | `chat_derived` | Planung / Repo-Orientierung | `README.md` und `AGENTS.md` wurden auf `STATE.md` und `RADAR.md` als Einstiegsschicht ausgerichtet | `STATE.md`, `README.md`, `AGENTS.md` |
| Primary Maya Surface Evidence Closure | `adopted` | `chat_derived` | Evidenz / Produktordnung | Die repo-sichtbare Rahmung von `/`, `/maya` und `/chat` wurde belegt und in den Zustandsdokumenten nachgezogen | `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Surface-State Axis Shift Follow-Up | `adopted` | `spec_pack` | Runtime / Surface-State | Lokal als enger Vertragsblock übernommen: `surface-state` liefert nur noch schmale Anker plus die abgeleitete Oberfläche und begrenzt damit die Hybrid-Leakage an der Naht | `docs/spec-packs/products/maya/K5_RUNTIME_AXIS_DECISION_NOTE.md`, `lib/maya-surface-state.ts`, `components/maya-chat-screen.tsx` |
| Pre-Dispatch Crush Light | `adopted` | `web_ai_derived`, `compression_tested` | Execution / epistemic intake | Lokal als enger Dispatch-Miniblock übernommen: vor dem Provider-Call wird der nicht wegstreichbare Kern der letzten User-Nachricht intern markiert, ohne UI-, Memory- oder Surface-State-Verträge zu verbreitern | externe Spec `2026-03-26`, `lib/maya-provider-dispatch.ts`, `__tests__/lib/maya-provider-dispatch.test.ts` |
| Truth-Marked Continuity Transfer Contract | `adopted` | `spec_pack`, `cross_combined` | Continuity / Vertragsgrenzen | Lokal als enger Digest-Vertragsblock übernommen: stale Digest-Zustände werden nicht mehr still als aktueller Kontinuitätsstand durchgereicht, sondern fallen auf Session-Wahrheit zurück | `docs/spec-packs/products/maya/CONTINUITY.md`, `docs/spec-packs/products/maya/CONTRACT.md`, `lib/maya-thread-digest.ts` |
| Review / Observation Closure for Runtime Focus and Continuity Truth | `adopted` | `chat_derived` | Verification / Runtime-Seams | Lokal als enger Evidence-Block übernommen: gezielte Regressionstests sichern jetzt die reale Wirkung von `Pre-Dispatch Crush Light` und dem stale-Digest-Fallback an ihren Konsumkanten ab, ohne neue Runtime- oder UI-Mechanik zu öffnen | `__tests__/lib/maya-provider-dispatch.test.ts`, `__tests__/lib/maya-thread-digest.test.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Guardrail Signal Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Guardrail-Heuristik | Lokal als enger Evidence-Block übernommen: die bestehende `mirror`-/`overclaimWarning`-/`freshnessWarning`-Heuristik wurde in eine pure Lib-Datei überführt und mit gezielten Regressionstests gegen absolute Claims, repo-geerdete Entwarnung und Frischeanker abgesichert, ohne Runtime- oder UI-Mechanik zu erweitern | `lib/maya-epistemic-guardrail.ts`, `app/api/maya/chat/route.ts`, `__tests__/api/maya-chat-guardrail.test.ts` |
| Real-Run Focus Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Interplay | Lokal als enger Zusammenspiel-Evidence-Block übernommen: eine nah simulierte Laufspur prüft jetzt gemeinsam Fokuspriorisierung, stale-Digest-Fallback und Guardrail-Nachspur, sowohl im bounded Nullfall als auch im Driftfall mit Warnsignalen | `__tests__/lib/maya-real-run-focus-observation.test.ts`, `lib/maya-provider-dispatch.ts`, `lib/maya-thread-digest.ts`, `lib/maya-epistemic-guardrail.ts` |
| Guardrail Signal Stability Review Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Guardrail stability | Lokal als enger Review- und Evidence-Block übernommen: `mirror`, `overclaimWarning` und `freshnessWarning` werden jetzt über guardrail-nahe Antwortlagen darauf beobachtet, dass repo-geerdete Antworten mit Frischeanker ruhig bleiben, driftige absolute Zeitbehauptungen weiter beide Warnsignale auslösen und repo-kontextnahe Frischeformulierungen ohne expliziten Commit-Anker derzeit bewusst still bleiben | `__tests__/lib/maya-guardrail-signal-stability-review.test.ts`, `lib/maya-epistemic-guardrail.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Handoff / Resume Distinctness Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Derived signal separation | Lokal als enger Distinctness-Evidence-Block übernommen: `resumeActions`, Checkpoint-Board und `handoff` werden jetzt gegen semantische Signal-Dopplung beobachtet, sowohl im differenzierten Fall als auch im bounded Kollaps bei wiederholter Thread-Wahrheit | `__tests__/lib/maya-handoff-resume-distinctness-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Workspace Next-Milestone Distinctness Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Workspace signal separation | Lokal als enger Distinctness-Evidence-Block übernommen: die workspace-nahe Ableitung wird jetzt gegen Überschneidung von `goal`, `currentState`, `nextMilestone` und `openItems` beobachtet, sowohl im differenzierten Fall als auch im bounded Kollaps bei wiederholter Thread-Wahrheit | `__tests__/lib/maya-workspace-next-milestone-distinctness-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Prioritization Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Primary signal prioritization | Lokal als enger Distinctness-Evidence-Block übernommen: die Hauptableitung wird jetzt gegen Überschneidung von `primaryFocus`, `primaryNextStep` und `primaryOpenPoint` beobachtet und zusätzlich darauf, dass Workrun-/Handoff-Signale konkurrierende Workspace-Fallbacks verdrängen | `__tests__/lib/maya-primary-surface-prioritization-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Fallback Boundary Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Primary fallback boundaries | Lokal als enger Boundary-Evidence-Block übernommen: die Hauptableitung wird jetzt gegen Leckage persistierter Workrun-, Handoff-, Digest- und Workspace-Signale im Early-Thread-Fall beobachtet und zusätzlich darauf, welche Defaults in ruhigen Threads tatsächlich sichtbar bleiben | `__tests__/lib/maya-primary-surface-fallback-boundary-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Quiet-Thread Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Quiet-thread minimal truth | Lokal als enger Quiet-Thread-Evidence-Block übernommen: die Hauptableitung wird jetzt gegen leere Threads, schwache Early-Threads und ruhige, aber bereits inhaltliche Threads beobachtet, damit Minimal-Defaults, Start-State-Leitplanken und konkrete Thread-Wahrheit sauber getrennt bleiben | `__tests__/lib/maya-primary-surface-quiet-thread-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Low-Activity Repetition Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Low-activity bounded repetition | Lokal als größerer Low-Activity-Evidence-Block übernommen: die Hauptableitung wird jetzt über mehrere signalarme, aber nicht leere Thread-Konstellationen darauf beobachtet, dass sie in einen kleinen bounded meaning set kollabiert statt zusätzliche Semantik zu vervielfachen, und dass konkurrierende Workspace-Fallbacks diese begrenzte Primärpaarung nicht aufblasen | `__tests__/lib/maya-primary-surface-low-activity-repetition-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Low-Activity Source-Alignment Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Low-activity source alignment | Lokal als größerer Low-Activity-Evidence-Block übernommen: die Hauptableitung wird jetzt darauf beobachtet, dass `briefing`, `workrun`, `handoff`, `workspace` und Primärsignale bei abgeleiteter Low-Activity denselben kleinen Bedeutungssatz konsistent tragen, während manuelle Workspace-Wahrheit als explizite Abweichung sichtbar bleibt | `__tests__/lib/maya-primary-surface-low-activity-source-alignment-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Low-Activity Manual-Truth Precedence Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Low-activity manual truth precedence | Lokal als größerer Low-Activity-Evidence-Block übernommen: die Hauptableitung wird jetzt darauf beobachtet, dass manuelle `workrun`-, `handoff`- und `workspace`-Wahrheit in den tatsächlich beabsichtigten Primärbahnen Vorrang behält, ohne angrenzende Low-Activity-Signale unbeabsichtigt mitzuziehen | `__tests__/lib/maya-primary-surface-low-activity-manual-truth-precedence-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Low-Activity Manual-Truth Collision Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Low-activity manual truth collisions | Lokal als größerer Low-Activity-Evidence-Block übernommen: die Hauptableitung wird jetzt darauf beobachtet, wie gleichzeitige manuelle `workrun`-, `handoff`- und `workspace`-Wahrheiten gegeneinander kollidieren und welche Primärbahnen dabei tatsächlich stabil gewonnen oder verloren werden | `__tests__/lib/maya-primary-surface-low-activity-manual-truth-collision-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Low-Activity Partial Manual-Truth Fallback Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Low-activity partial manual truth fallback | Lokal als größerer Low-Activity-Evidence-Block übernommen: die Hauptableitung wird jetzt darauf beobachtet, wie partielle manuelle `workrun`-, `handoff`- und `workspace`-Wahrheit ihre leeren Felder intern mit abgeleiteten Low-Activity-Spuren auffüllt, ohne die Source-Ownership zu verlieren | `__tests__/lib/maya-primary-surface-low-activity-partial-manual-truth-fallback-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Low-Activity Manual-Truth Convergence Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Low-activity manual truth convergence | Lokal als größerer Low-Activity-Evidence-Block übernommen: die Hauptableitung wird jetzt darauf beobachtet, dass manuelle `workrun`-, `handoff`- und `workspace`-Source-Ownership stabil bleiben kann, auch wenn die sichtbaren Werte textlich mit briefing-, workrun-, handoff- oder primären Ableitungslinien zusammenfallen | `__tests__/lib/maya-primary-surface-low-activity-manual-truth-convergence-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Low-Activity Source-Ownership Stability Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Low-activity source ownership stability | Lokal als größerer Low-Activity-Evidence-Block übernommen: die Persist-Builder und die Hauptableitung werden jetzt darauf beobachtet, dass manuelle Source-Ownership für `workrun`, `handoff` und `workspace` auch nach semantisch unverändertem Persist-/Re-Derive-Zyklus stabil bleibt | `__tests__/lib/maya-primary-surface-low-activity-source-ownership-stability-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Low-Activity Persisted Partial-Update Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Low-activity persisted partial updates | Lokal als größerer Low-Activity-Evidence-Block übernommen: die Persist-Builder werden jetzt darauf beobachtet, wie partielle manuelle Updates in `workrun`, `handoff` und `workspace` fehlende Felder kontrolliert ergänzen oder erhalten, ohne semantische Drift oder Ownership-Verlust zu erzeugen | `__tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Low-Activity Persisted Partial-Update Boundary Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Low-activity persisted partial update boundaries | Lokal als größerer Low-Activity-Evidence-Block übernommen: die Persist-Builder werden jetzt darauf beobachtet, dass partielle manuelle Updates in `workrun`, `handoff` und `workspace` sauber auf builder-eigene Bahnen begrenzt bleiben und nicht still angrenzende Persist- oder Primärbahnen mitziehen | `__tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-boundary-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Primary Surface Low-Activity Persisted Partial-Update Convergence Observation Closure | `adopted` | `chat_derived`, `cross_combined` | Verification / Low-activity persisted partial update convergence | Lokal als größerer Low-Activity-Evidence-Block übernommen: die Persist-Builder werden jetzt darauf beobachtet, dass partielle manuelle Updates in `workrun`, `handoff` und `workspace` auch dann manuelle Ownership behalten können, wenn das einzige aktualisierte Feld textlich mit bestehenden abgeleiteten oder primären Bahnen zusammenfällt | `__tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-convergence-observation.test.ts`, `lib/maya-thread-digest.ts`, `STATE.md`, `docs/spec-packs/products/maya/STATUS.md` |
| Focus / Re-Entry / Ops-Lens Surface Consolidation | `adopted` | `chat_derived` | UI / Hauptflächenfokus | Arbeitsraum- und Thread-Steuerung wurden als sekundäre Lens aus dem Primärfluss der Maya-Hauptfläche herausgezogen | `STATE.md`, `components/maya-chat-screen.tsx`, `components/maya/maya-ops-lens.tsx` |
| Active Workrun Detail Downshift | `adopted` | `chat_derived` | UI / Arbeitslauf-Fokus | Manuelle Arbeitslauf-Steuerung, Handoff-Details und Checkpoint-Pflege wurden aus der Primärfläche in die Ops-Lens verlagert | `STATE.md`, `components/maya-chat-screen.tsx`, `components/maya/maya-workrun-details.tsx` |
| Post-Dispatch Epistemic Guardrail | `adopted` | `web_ai_derived`, `cross_combined` | Execution / epistemic hardening | Mirror-/Warning-/Freshness-Nachlauf ist jetzt als enger post-dispatch Guardrail auf Achse B repo-sichtbar umgesetzt | `app/api/maya/chat/route.ts`, externe Spec `2026-03-26` |
| Handoff Prominence Tightening + Secondary Guardrail Surfacing | `adopted` | `chat_derived`, `cross_combined` | UI / Ops Lens | Aktive Handoff-Prominenz wurde weiter reduziert und Guardrail-Signale bleiben als sekundäres Lens-Surface sichtbar statt die Primärfläche zu belasten | `components/maya-chat-screen.tsx`, `components/maya/maya-workrun-details.tsx` |

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
- `truth_class`
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
- `absorbed_into`, wenn der Kandidat später repo-sichtbar übernommen wurde
- `next_gate`, damit der Übergang aus Radar in reale Arbeit oder Archivierung nicht implizit bleibt

## Kompressionsformat für neue Scan-Kandidaten

Wenn neue Materialien eingescannt werden, soll die Verdichtung bevorzugt in diesem Format in `RADAR.md` landen:

- `Titel`
- `Quellen`
- `Unzerstörbarer Kern`
- `Exponierte Annahmen`
- `Weggeworfen`
- `Kernproblem`
- `Kernidee`
- `kombinierbare Teilideen`
- `Widersprüche / Risiken`
- `Maya-Fit`
- `empfohlener Blockzuschnitt`
- `Urteil`: jetzt / später / nein

Optional, wenn ein zusätzlicher Prüfdruck echten Erkenntnisgewinn bringt:

- `compression_check:`
  - `mode:`
  - `core:`
  - `reaction_class:`
  - `direction:`
  - `why_not_more:`

## Adoption-Regeln

Ein Radar-Eintrag darf nur dann auf `adopted` wechseln, wenn mindestens eines davon klar belegt ist:

- reale Repo-Änderung vorhanden
- Commit-/Push-Linie vorhanden
- oder `STATE.md` führt ihn explizit als Teil der aktuellen Wahrheit

Bei `adopted` zusätzlich festhalten:

- `truth_class` soll auf `repo_visible` wechseln
- `absorbed_into` soll Block, Dateien oder Commit benennen

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
- für neue Quellen gezielt Scan-Läufe fahren, Kernelemente komprimieren und nur Maya-taugliche Kandidaten als mögliche Blöcke vorschlagen
