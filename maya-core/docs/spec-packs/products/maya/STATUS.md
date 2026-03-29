# STATUS

## Zweck

Diese Datei hält den aktuellen Maya-Zustand für `maya-core` fest.
Sie trennt strikt zwischen beobachtbarem Ist-Zustand, lokaler Verifikation, live-verifiziertem Zustand, unklaren Punkten und proposal-only Material.
Für die kleine repo-nahe Wahrheitstrennung der aktiven Hybrid-Seams siehe zusätzlich `MAYA_HYBRID_TRUTH_READABILITY_AUDIT.md` im `maya-core`-Root.

## Evidenzklassen

- `repo-sichtbar`
  - direkt im Repository, in Dateien, Routen, Build-Ausgaben oder Konfigurationen belegbar
- `lokal verifiziert`
  - im lokalen Stand dieser Aufnahme durch Build, Typecheck, laufenden Server oder Terminalbefund bestätigt
- `live-verifiziert`
  - gegen eine externe laufende Instanz bestätigt
- `unklar`
  - derzeit weder repo-sichtbar noch frisch lokal oder live belastbar belegt; bewusst offen zu halten
- `proposal-only`
  - Zielbild, Spezifikationsregel oder bewusste Entwurfsannahme ohne Behauptung, dass dies bereits umgesetzt ist
- `agent-reported`
  - zusammenfassende Einordnung auf Basis der belegten Fakten; kein eigener Wahrheitsrang ohne Beleg

## Aktueller Kurzstatus

Maya ist im Repo als eigenständige Next-App mit mehreren UI-Routen und mehreren API-Linien vorhanden.

Der Stand ist architektonisch uneinheitlich: Es gibt parallel einen älteren Product-State-Strang und einen separaten `/api/maya/*`-Strang.
Die kleine repo-nahe Lesbarkeitstrennung für public repo-visible truth, local-only working truth und status-/review-nahe Sprache liegt in `MAYA_HYBRID_TRUTH_READABILITY_AUDIT.md`.

Der lokale Build ist grün. Ein früherer voller lokaler Typecheck lief grün; im aktuellen K3-Block wurde stattdessen ein schlanker `tsc --noEmit --skipLibCheck`-Check ohne Fehloutput verwendet, weil der volle Typecheck im laufenden Windsurf-Setup hängen kann. Eine lokale Instanz auf `127.0.0.1:3000` antwortete auf die sichtbaren Kernpfade mit Login-Redirects und lieferte für `/api/health` einen leichten JSON-Healthcheck. Die Sprachlage ist weiterhin gemischt de/en, aber die sichtbare Produktoberfläche rahmt `/maya`, `/chat`, `/context` und `/supervisor` klarer als zuvor. README und tatsächlicher Codezustand liegen näher beieinander, sind aber nicht identisch. K3-Infra-Artefakte für einen internen Architect-Block sind nun repo-sichtbar angelegt. K4 Fokus-Screen Reordnung ist repo-sichtbar umgesetzt und lokal per TypeScript-Prüfung verifiziert: `app/maya/page.tsx` rendert jetzt eine Fokus-Zone mit Maya Brief, Next Step Hero, Context-Strip und vorgelagertem Composer-Verhalten, während sekundäre Sections auf der Fokusfläche ausgeblendet bleiben. K5 Block 1 ist nun repo-sichtbar als Dokumentationsentscheid angelegt: Die aktuelle `/maya`-Runtime wird explizit als Hybrid aus Achse A (Kontinuität/Persistenz) und Achse B (Execution/Provider) beschrieben; Achse B ist als Zielpfad für neue Execution-Logik benannt, ohne bereits eine vollständige technische Ein-Achsen-Umstellung zu behaupten. K5 Block 2 ist nun repo-sichtbar als Marker-Block angelegt: Legacy-/Canonical-Kommentare markieren die betroffenen Achsen-Dateien, und `app/maya/page.tsx` trägt einen Hybrid-Marker an der sichtbaren Zusammenführung, ohne Verhaltensänderung zu behaupten. K5 Block 5 ist repo-sichtbar als erste echte Call-Site-Entkopplung umgesetzt: `app/maya/page.tsx` liest seinen Surface-State nun über `/api/maya/surface-state`. K6 ist repo-sichtbar als Design-/Architect-Kontext-Block ergänzt: `DESIGN.md` definiert jetzt eine agent-lesbare Maya-Design-Wahrheit, und der interne Architect-Kontext liest diese Datei mit.

## Interface-Stand (22.03.2026)

### Funktionaler Stand

`/maya` ist funktional substanziell gewachsen.

- Thread-Kontinuität, Fadenkompass, Checkpoints und Resume-Actions sind sichtbar angelegt
- Arbeitsraum-Kontext, verbundene Threads und Arbeitslauf-Tracking sind repo-sichtbar vorhanden
- mehrere Einstiegspfade sind funktional vorhanden

### UX-Befund (IST)

Die aktuelle `/maya`-Fläche ist UX-seitig weiterhin überladen.

Die folgenden Werte sind **Analysebefund aus Screenshot- und Oberflächenanalyse (Stand 21.03.2026, ca.-Werte)** und keine harte Code-Metrik:

| Problem | Beschreibung |
|---|---|
| Gleichrangige Sektionen | ca. 24 Sektionen ohne klare visuelle Hierarchie |
| Kein primärer Button | ca. 27 Buttons, keiner erkennbar dominant |
| Placeholder-Wiederholung | derselbe Initialisierungstext erscheint vielfach als Füllinhalt |
| Composer zu weit unten | primäre Interaktion erst nach deutlichem Scrollen erreichbar |
| Dashboard-Drift | Fläche wirkt wie Tool-Board, nicht wie Companion Surface |
| Doppelte Inhalte | mehrere Sektionen transportieren fast identische Informationen |

### Orientierung

- Aktuelle Fläche: funktional belastbar, UX-hierarchisch noch nicht gelöst
- Produktentscheidung in `BLUEPRINT.md`: `/maya` als primäre Companion Surface für `maya-core`
- K4 Fokus-Screen Reordnung ist im engen Scope in `app/maya/page.tsx` umgesetzt
- K5 Block 1 ist als Doku-Block angelegt und beschreibt den aktuellen Hybridzustand sowie die Übergangsgrenzen zwischen Achse A und Achse B
- K5 Block 2 ist als Marker-Block angelegt und setzt Legacy-/Canonical-/Hybrid-Hinweise ohne Verhaltensänderung
- K5 Block 3 ist als Vorbereitungsblock abgeschlossen: `app/maya/page.tsx` bleibt vorerst an `readMayaStore()` gebunden, weil noch kein gleichwertiger Achse-B-Read-Pfad für `activeSession`, `activeWorkspace` und `buildMayaMainSurfaceDerivation(...)` repo-sichtbar ist
- K5 Block 4 ist als API-Design-/Vertragsblock abgeschlossen: `/api/maya/surface-state` ist als minimaler Surface-State-Endpunkt angelegt und liefert `activeSession`, `activeWorkspace` und `surface`, ohne `app/maya/page.tsx` schon umzubauen
- K5 Block 5 ist als erste echte Call-Site-Entkopplung abgeschlossen: `app/maya/page.tsx` liest seinen Surface-State jetzt serverseitig über `/api/maya/surface-state` statt direkt über `readMayaStore()`
- K6 ist als Design-/Architect-Kontext-Block abgeschlossen: `DESIGN.md` ergänzt die Maya-Quellen um Farbsystem, Komponentenregeln, Screen-Modi und verbotene Muster; `repo-reader` und `architect-prompt` berücksichtigen diese Referenz jetzt explizit
- K6.1 ist als Doku-/Prompt-Hardening-Block ergänzt: `lib/architect-prompt.ts` enthält nun eine Mirror-Regel für STOP/FRAGE-Antworten ohne neue Architekturideen; `DESIGN.md` ergänzt die Re-Entry-Assumption-Struktur sowie die STALE-Trigger-Regel für den Context-Strip, ohne UI- oder Runtime-Verhalten als bereits umgesetzt zu behaupten
- K7-Prep ist repo-sichtbar als Guardrail-Vorbereitung angelegt: `tests-e2e/maya-k7-prep.spec.ts` enthält genau einen Smoke-Test und einen Snapshot-Test für `/maya`; die erste Baseline-Erzeugung bleibt bewusst deferred
- K7 Block 1 ist repo-sichtbar als erste kleine UI-Extraktion umgesetzt: Der darstellungsnahe Message-Feed aus `components/maya-chat-screen.tsx` wurde in `components/maya/maya-message-feed.tsx` ausgelagert, ohne `sendMessage`-, Persistenz- oder Workrun-Mutationslogik zu verschieben
- K7 Block 2 ist repo-sichtbar als weitere kleine UI-Extraktion umgesetzt: Der darstellungsnahe ThreadDigest-/Fadenkompass-Block aus `components/maya-chat-screen.tsx` wurde in `components/maya/maya-thread-digest.tsx` ausgelagert, ohne Digest-Ableitung, Persistenz- oder Refresh-Logik zu verschieben
- Primary-Surface-Evidence-Closure ist repo-sichtbar als Doku-Abgleich abgeschlossen: `/` rendert einen auth-geschützten Maya-Gateway-Einstieg mit dominanter CTA nach `/maya`, `components/primary-nav.tsx` ordnet `/maya` vor `/chat`, und `components/chat-screen.tsx` verweist im Banner und im Seitenpanel explizit zurück auf `/maya`
- Focus-/Re-Entry-/Ops-Lens-Konsolidierung ist repo-sichtbar in engem UI-Scope umgesetzt: `components/maya-chat-screen.tsx` hält Arbeitslauf, Feed und Composer im Primärfluss, während Arbeitsraum-Kontext und Thread-Steuerung über `components/maya/maya-ops-lens.tsx` in eine sekundäre Lens ausgelagert werden; `components/maya/maya-topbar.tsx` enthält dafür den sichtbaren Lens-Trigger
- Active-Workrun-Detail-Downshift ist repo-sichtbar in engem UI-Scope umgesetzt: `components/maya/maya-active-workrun-panel.tsx` hält auf der Hauptfläche jetzt nur noch Fokus, nächsten Schritt, offenen Kernpunkt, letzten Output und direkte Fortsetzungsaktionen; manuelle Steuerung, Handoff-/Wiedereinstiegsdetails und Checkpoint-Pflege liegen in `components/maya/maya-workrun-details.tsx` innerhalb der Ops-Lens
- Post-Dispatch-Epistemic-Guardrail ist repo-sichtbar in engem Achse-B-Scope umgesetzt: `app/api/maya/chat/route.ts` ergänzt nach `dispatchChat()` einen heuristischen Nachlauf mit optionalem `epistemicGuardrail`, der `mirror`, `overclaimWarning` und `freshnessWarning` liefert, ohne Dispatch-, Persistenz-, Memory- oder Surface-State-Verträge umzubauen
- Handoff-Prominence-Tightening mit sekundärem Guardrail-Surfacing ist repo-sichtbar in engem UI-Scope umgesetzt: `components/maya-chat-screen.tsx` hält Guardrail-Signale nur als sekundären Summary-Hinweis und Lens-State, während `components/maya/maya-workrun-details.tsx` aktive Handoff-Details enger an echte Abweichung bzw. Park-/Abschlusszustände bindet und Mirror-/Warning-Signale nur innerhalb der Ops-Lens zeigt
- Guardrail-Signal-Calibration ist repo-sichtbar als enger Folgeblock umgesetzt: `app/api/maya/chat/route.ts` reduziert False Positives für repo-/code-geerdete Antworten durch engere Overclaim-/Freshness-Heuristiken, und `components/maya-chat-screen.tsx` sowie `components/maya/maya-workrun-details.tsx` surfacen den sekundären Guardrail nur noch bei echten Warnsignalen statt bereits bei bloßer Mirror-Spiegelung
- `npm --prefix maya-core run typecheck` lief nach dem Downshift erfolgreich
- `npx tsc --noEmit --skipLibCheck` lief lokal nach dem post-dispatch Guardrail und nach dem Lens-Follow-up jeweils ohne Fehloutput
- `npx tsc --noEmit --skipLibCheck` lief lokal auch nach der Guardrail-Kalibrierung ohne Fehloutput
- lokal ist jetzt ein enger K5-Folgeblock zur internen Surface-State-Verschiebung umgesetzt: `lib/maya-surface-state.ts` gibt über `/api/maya/surface-state` nur noch schmale Session-/Workspace-Anker plus die abgeleitete Oberfläche zurück; `components/maya-chat-screen.tsx` wurde auf diesen verengten Vertrag nachgezogen, ohne UI-, Guardrail- oder Persistenzverhalten mitzubewegen
- lokal ist jetzt auch `Pre-Dispatch Crush Light` als enger Achse-B-Miniblock umgesetzt: `lib/maya-provider-dispatch.ts` ergänzt vor dem Provider-Call einen internen Prompt-Abschnitt, der aus der letzten User-Nachricht den nicht wegstreichbaren Kern ableitet und als Fokusregel markiert, ohne UI-, Memory- oder Surface-State-Verträge zu verbreitern
- lokal ist jetzt auch `Truth-Marked Continuity Transfer Contract` als enger Digest-Vertragsblock umgesetzt: `lib/maya-thread-digest.ts` behandelt einen `session.digest` mit `needsRefresh` nicht mehr still als aktuellen Kontinuitätsstand, sondern fällt in `buildContinuityBriefing()` auf laufzeitnahen Session-Kontext zurück; dadurch wird die Digest-Wahrheit enger begrenzt, ohne UI-, Provider-, Persistenz- oder Surface-State-Verträge zu erweitern
- lokal ist jetzt auch ein enger Review-/Observation-Block für Runtime-Fokus und Kontinuitätswahrheit umgesetzt: `__tests__/lib/maya-provider-dispatch.test.ts` sichert jetzt zusätzlich die Priorisierung der letzten User-Nachricht und den Fallback auf das längste substanzielle Segment im `Pre-Dispatch Crush Light`; `__tests__/lib/maya-thread-digest.test.ts` sichert zusätzlich, dass stale Digest-Zustände nicht in die Hauptableitung der Maya-Oberfläche zurückleaken
- lokal ist jetzt auch `Guardrail Signal Observation Closure` als enger Evidence-Block umgesetzt: die bestehende `mirror`-/`overclaimWarning`-/`freshnessWarning`-Heuristik wurde in `lib/maya-epistemic-guardrail.ts` isoliert und mit `__tests__/api/maya-chat-guardrail.test.ts` gegen absolute Claims, repo-geerdete Entwarnung, angeforderte Sicherheit und Frischeanker-Randfälle abgesichert, ohne neue Runtime-, UI- oder Prompt-Mechanik zu öffnen
- lokal ist jetzt auch `Real-Run Focus Observation Closure` als enger Zusammenspiel-Evidence-Block umgesetzt: `__tests__/lib/maya-real-run-focus-observation.test.ts` beobachtet über nah simulierte Laufspuren gemeinsam die Fokuspriorisierung aus `Pre-Dispatch Crush Light`, den stale-Digest-Fallback der Hauptableitung und die Guardrail-Nachspur sowohl im bounded Nullfall als auch im Driftfall mit Warnsignalen
- lokal ist jetzt auch `Guardrail Signal Stability Review Closure` als enger Review- und Evidence-Block umgesetzt: `__tests__/lib/maya-guardrail-signal-stability-review.test.ts` beobachtet, dass repo-geerdete Antworten mit explizitem Frischeanker ruhig bleiben, driftige absolute Zeitbehauptungen weiter beide Warnsignale auslösen und repo-kontextnahe Frischeformulierungen ohne expliziten Commit-Anker derzeit bewusst still bleiben, ohne daraus neue Guardrail-Mechanik abzuleiten
- lokal ist jetzt auch `Pre-Dispatch Crush Light Review Closure` als enger Review- und Evidence-Block umgesetzt: `__tests__/lib/maya-pre-dispatch-crush-light-review.test.ts` beobachtet, dass die letzte User-Nachricht gegenüber älteren Breitenpfaden priorisiert bleibt, request-nahe Segmente innerhalb der letzten Nachricht gewinnen, der Fallback auf den eigentlichen Druck auch ohne explizite Request-Phrase weiter trägt und driftige absolute Zeitbehauptungen trotz enger Fokusmarkierung weiter von der Guardrail-Nachspur markiert werden
- lokal ist jetzt auch `Handoff / Resume Distinctness Observation Closure` als enger Distinctness-Evidence-Block umgesetzt: `__tests__/lib/maya-handoff-resume-distinctness-observation.test.ts` beobachtet, dass `resumeActions`, Checkpoint-Board und `handoff` sich bei differenzierter Thread-Wahrheit semantisch sauber aufteilen und bei wiederholter Thread-Wahrheit klein und bounded kollabieren statt Signalrauschen zu vervielfachen
- lokal ist jetzt auch `Workspace Next-Milestone Distinctness Observation Closure` als enger Distinctness-Evidence-Block umgesetzt: `__tests__/lib/maya-workspace-next-milestone-distinctness-observation.test.ts` beobachtet, dass `goal`, `currentState`, `nextMilestone` und `openItems` in der workspace-nahen Ableitung bei differenzierter Thread-Wahrheit semantisch getrennt bleiben und bei wiederholter Thread-Wahrheit klein und bounded kollabieren
- lokal ist jetzt auch `Primary Surface Prioritization Observation Closure` als enger Distinctness-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-prioritization-observation.test.ts` beobachtet, dass `primaryFocus`, `primaryNextStep` und `primaryOpenPoint` auf der Hauptableitung bei differenzierter Thread-Wahrheit semantisch priorisiert und getrennt bleiben und dass Workrun-/Handoff-Signale konkurrierende Workspace-Fallbacks verdrängen
- lokal ist jetzt auch `Primary Surface Fallback Boundary Observation Closure` als enger Boundary-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-fallback-boundary-observation.test.ts` beobachtet, dass persistierte Workrun-, Handoff-, Digest- und Workspace-Signale im Early-Thread-Fall nicht still in die Primärfläche zurückleaken und dass ruhige Threads stattdessen auf die aktuell tatsächlich abgeleiteten Defaults zurückfallen
- lokal ist jetzt auch `Primary Surface Quiet-Thread Observation Closure` als enger Quiet-Thread-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-quiet-thread-observation.test.ts` beobachtet, dass leere Threads auf minimale Defaults begrenzt bleiben, schwache Early-Threads auf Start-State-Leitplanken bleiben und ruhige, aber bereits inhaltliche Threads auf konkrete Thread-Wahrheit statt auf Leer- oder Start-State-Fallbacks geerdet werden
- lokal ist jetzt auch `Primary Surface Low-Activity Repetition Observation Closure` als größerer Low-Activity-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-low-activity-repetition-observation.test.ts` beobachtet über mehrere signalarme, aber nicht leere Thread-Konstellationen, dass die Primärfläche in einen kleinen bounded meaning set kollabiert statt zusätzliche Semantik zu vervielfachen, und dass konkurrierende Workspace-Fallbacks diese begrenzte Primärpaarung nicht aufblasen
- lokal ist jetzt auch `Primary Surface Low-Activity Source-Alignment Observation Closure` als größerer Low-Activity-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-low-activity-source-alignment-observation.test.ts` beobachtet, dass `briefing`, `workrun`, `handoff`, `workspace` und Primärsignale bei abgeleiteter Low-Activity denselben kleinen Bedeutungssatz konsistent tragen und dass manuelle Workspace-Wahrheit als explizite Abweichung sichtbar bleibt statt still in die Primärfläche zu rutschen
- lokal ist jetzt auch `Primary Surface Low-Activity Source-Boundary Observation Closure` als größerer Low-Activity-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-low-activity-source-boundary-observation.test.ts` beobachtet, an welchen Stellen manuelle `workrun`-, `handoff`- und `workspace`-Wahrheit bewusst von der abgeleiteten Low-Activity-Spur abweichen darf, ohne dass die Primärfläche still zwischen Quellen ausfranst
- lokal ist jetzt auch `Primary Surface Low-Activity Manual-Truth Precedence Observation Closure` als größerer Low-Activity-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-low-activity-manual-truth-precedence-observation.test.ts` beobachtet, dass manuelle `workrun`-, `handoff`- und `workspace`-Wahrheit in den tatsächlich beabsichtigten Primärbahnen Vorrang behält, ohne angrenzende Low-Activity-Signale unbeabsichtigt mitzuziehen
- lokal ist jetzt auch `Primary Surface Low-Activity Manual-Truth Collision Observation Closure` als größerer Low-Activity-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-low-activity-manual-truth-collision-observation.test.ts` beobachtet, dass manuelle `workrun`-, `handoff`- und `workspace`-Wahrheit bei gleichzeitigem Auftreten deterministisch aufgeteilt werden und nicht still kollidieren
- lokal ist jetzt auch `Primary Surface Low-Activity Partial Manual-Truth Fallback Observation Closure` als größerer Low-Activity-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-low-activity-partial-manual-truth-fallback-observation.test.ts` beobachtet, wie partielle manuelle `workrun`-, `handoff`- und `workspace`-Wahrheit ihre leeren Felder intern mit abgeleiteten Low-Activity-Spuren auffüllt, ohne die Source-Ownership zu verlieren
- lokal ist jetzt auch `Primary Surface Low-Activity Manual-Truth Convergence Observation Closure` als größerer Low-Activity-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-low-activity-manual-truth-convergence-observation.test.ts` beobachtet, dass manuelle `workrun`-, `handoff`- und `workspace`-Source-Ownership stabil bleiben kann, auch wenn die sichtbaren Werte textlich mit briefing-, workrun-, handoff- oder primären Ableitungslinien zusammenfallen
- lokal ist jetzt auch `Primary Surface Low-Activity Source-Ownership Stability Observation Closure` als größerer Low-Activity-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-low-activity-source-ownership-stability-observation.test.ts` beobachtet, dass manuelle Source-Ownership für `workrun`, `handoff` und `workspace` auch nach semantisch unverändertem Persist-/Re-Derive-Zyklus stabil bleibt
- lokal ist jetzt auch `Primary Surface Low-Activity Persisted Partial-Update Observation Closure` als größerer Low-Activity-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-observation.test.ts` beobachtet, wie partielle manuelle Persist-Updates in `buildPersistedWorkrun`, `buildPersistedThreadHandoff` und `buildPersistedWorkspaceContext` fehlende Felder kontrolliert ergänzen oder erhalten, ohne semantische Drift oder Ownership-Verlust zu erzeugen
- lokal ist jetzt auch `Primary Surface Low-Activity Persisted Partial-Update Boundary Observation Closure` als größerer Low-Activity-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-boundary-observation.test.ts` beobachtet, dass partielle manuelle Persist-Updates in `workrun`, `handoff` und `workspace` sauber auf builder-eigene Bahnen begrenzt bleiben und nicht still angrenzende Persist- oder Primärbahnen mitziehen
- lokal ist jetzt auch `Primary Surface Low-Activity Persisted Partial-Update Convergence Observation Closure` als größerer Low-Activity-Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-convergence-observation.test.ts` beobachtet, dass partielle manuelle Persist-Updates in `workrun`, `handoff` und `workspace` ihre manuelle Source-Ownership auch dann behalten, wenn das einzige aktualisierte Feld textlich mit bestehenden Persist- oder Primärbahnen zusammenfällt
- lokal ist jetzt auch `Primary Surface Checkpoint-Board Boundary Observation Closure` als enger Review- und Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-checkpoint-board-boundary-observation.test.ts` beobachtet an der bestehenden Hauptableitung, dass ein manuelles `checkpointBoard` sichtbar und board-eigen bleiben kann, ohne still die `primaryNextStep`- oder `primaryOpenPoint`-Bahn zu übernehmen, wenn `workrun.nextStep` und `handoff.openItems` diese Primärbahnen bereits tragen
- lokal ist jetzt auch `Primary Surface Workspace Open-Point Boundary Observation Closure` als enger Review- und Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-workspace-open-point-boundary-observation.test.ts` beobachtet an der bestehenden Hauptableitung, dass ein manuelles `workspace.openItems` sichtbar und workspace-eigen bleiben kann, ohne still die `primaryOpenPoint`-Bahn zu übernehmen, wenn `handoff.openItems` diese Primärbahn bereits tragen
- lokal ist jetzt auch `Primary Surface Handoff Open-Point Boundary Observation Closure` als enger Review- und Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-handoff-open-point-boundary-observation.test.ts` beobachtet an der bestehenden Hauptableitung, dass ein manuelles `handoff.openItems` die `primaryOpenPoint`-Bahn weiter tragen kann, ohne still von `briefing.openLoops` verdrängt zu werden, wenn die aktive Übergabespur bereits klar besetzt ist
- lokal ist jetzt auch `Briefing Open-Loop Resume Boundary Observation Closure` als enger Review- und Evidence-Block umgesetzt: `__tests__/lib/maya-briefing-open-loop-resume-boundary-observation.test.ts` beobachtet an der bestehenden Hauptableitung, dass `briefing.openLoops[0]` weiter eine sekundäre `resumeActions`-Spur mit `source: 'open_loop'` speisen kann, ohne die primäre Open-Point-Bahn zu übernehmen, wenn `handoff.openItems[0]` diese Bahn bereits trägt, und dass wiederholte briefing-nahe Signale klein und bounded kollabieren statt `next_step`, `open_loop` und `resume` um denselben Kerntext zu vervielfachen
- lokal ist jetzt auch ein minimaler lokaler Status für den neuen `Briefing Open-Loop Resume Boundary Observation Closure`-Block verifiziert: `__tests__/lib/maya-briefing-open-loop-resume-boundary-observation.test.ts` lief ohne Fehloutput
- lokal ist jetzt auch `Primary Surface Partial Repetition Observation Closure` als enger Review- und Evidence-Block umgesetzt: `__tests__/lib/maya-primary-surface-partial-repetition-observation.test.ts` beobachtet an der bestehenden Hauptableitung, dass `primaryNextStep` und `primaryOpenPoint` in einer wiederholungsnahen Threadlage kontrolliert auf denselben Kerntext ausgerichtet sein dürfen, während der breitere briefing-nahe Open-Loop separat bleibt und nicht still die primäre Open-Point-Bahn übernimmt
- lokal ist jetzt auch `Primary Focus Boundary Observation Closure` als enger Review- und Evidence-Block umgesetzt: `__tests__/lib/maya-primary-focus-boundary-observation.test.ts` beobachtet an der bestehenden Hauptableitung, dass `primaryFocus` in einer wiederholungsnahen Lage bewusst als breiterer semantischer Lead bestehen bleiben kann, auch wenn `primaryNextStep` und `primaryOpenPoint` kontrolliert auf denselben Re-Entry-Signaltext zusammenfallen
- lokal ist jetzt auch `Focus Resume Boundary Observation Closure` als enger Review- und Evidence-Block umgesetzt: `__tests__/lib/maya-focus-resume-boundary-observation.test.ts` beobachtet an der bestehenden Hauptableitung, dass `primaryFocus` als breitere Leitbahn bestehen bleiben kann, während `resumeActions(source: 'resume')` zwar weiter vorhanden ist, aber semantisch nicht dieselbe Re-Entry-Rolle übernimmt wie `primaryNextStep` und `primaryOpenPoint`
- lokal ist jetzt auch `Resume Collapse Boundary Observation Batch` als enger Review- und Evidence-Batch umgesetzt: `__tests__/lib/maya-resume-collapse-next-step-observation.test.ts` und `__tests__/lib/maya-resume-collapse-open-loop-observation.test.ts` beobachten an der bestehenden Resume-Ableitung, dass `resumeActions(source: 'resume')` kontrolliert wegfallen darf, wenn der Fokustext bereits den `next_step`- oder den `open_loop`-Signaltext wiederholt und damit kein eigener zusätzlicher Resume-Mehrwert mehr entsteht
- lokal ist jetzt auch `Resume Current-State Boundary Observation Batch` als enger, aber größerer Review- und Evidence-Batch umgesetzt: `__tests__/lib/maya-resume-current-state-distinctness-observation.test.ts`, `__tests__/lib/maya-resume-current-state-next-step-collapse-observation.test.ts` und `__tests__/lib/maya-resume-current-state-open-loop-collapse-observation.test.ts` beobachten an der bestehenden Resume-Ableitung, dass `resumeActions(source: 'resume')` gegenüber `briefing.currentState` genau dann bestehen bleiben kann, wenn der Zustandsbezug noch einen eigenen Thread-Mehrwert trägt, und kontrolliert wegfallen darf, wenn `currentState` lediglich den `next_step`- oder den `open_loop`-Signaltext wiederholt
- lokal ist jetzt auch `Resume Focus Fallback Boundary Observation Batch` als enger, aber größerer Review- und Evidence-Batch umgesetzt: `__tests__/lib/maya-resume-focus-fallback-distinctness-observation.test.ts`, `__tests__/lib/maya-resume-focus-fallback-to-current-state-observation.test.ts` und `__tests__/lib/maya-resume-focus-fallback-collapse-observation.test.ts` beobachten an der bestehenden Resume-Ableitung, dass `resumeActions(source: 'resume')` zuerst an `briefing.focus` gebunden bleibt, kontrolliert auf `briefing.currentState` zurückfallen kann, wenn `focus` leer ist, und nicht still auf `currentState` durchfällt, wenn ein vorhandener `focus` bereits gegen `next_step` kollabiert
- lokal ist jetzt auch `Resume Start-State Boundary Observation Batch` als enger, aber größerer Review- und Evidence-Batch umgesetzt: `__tests__/lib/maya-resume-start-state-hard-stop-observation.test.ts`, `__tests__/lib/maya-resume-start-state-boundary-observation.test.ts` und `__tests__/lib/maya-resume-start-state-focus-irrelevance-observation.test.ts` beobachten an der bestehenden Resume-Ableitung, dass `buildResumeActions()` an der Start-State-Grenze vollständig stumm bleibt, solange `briefing.nextStep` exakt dem Start-State-Text entspricht, selbst wenn `focus`, `currentState` oder `openLoops` bereits gefüllt sind, und dass Resume-Signale sofort wieder entstehen dürfen, sobald `nextStep` diese harte Grenze verlässt
- lokal ist jetzt außerdem ein gezielter Vitest-Lauf über die elf neuen resume-nahen Observation-Dateien verifiziert (`11/11` Testdateien, `11/11` Tests, Exit-Code `0`); damit ist der zuletzt geschnittene Resume-/Signal-Evidence-Schnitt nicht nur review-seitig, sondern auch laufzeitnah lokal bestätigt
- lokal ist jetzt außerdem ein proposal-only Folgeblock für den ersten Bluepilot-Einstieg repo-nah angelegt: `docs/spec-packs/products/maya/proposals/BLUEPILOT_PLANNING_REVIEW_ENTRY_SPIKE.md` hält den empfohlenen ersten Entry-Seam bewusst als read-only Planning-/Review-Adapter fest, grenzt Dispatch-, Persistenz-, Surface- und Supervisor-Seams als No-Go-Zonen für den ersten Spike ab und definiert einen kleinstmöglichen späteren Spike-Zuschnitt noch ohne Umsetzung
- lokal ist jetzt außerdem ein kleiner read-only K2-Build-Block umgesetzt: `lib/maya-bluepilot-review.ts` ergänzt mit `buildBluepilotPlanningReview(...)` einen rein lesenden Planning-/Review-Helper auf Basis bestehender Maya-Surface-Signale; `__tests__/lib/maya-bluepilot-review.test.ts` hält Nullfall, Fokusfall, Open-Point-Review-Winkel und bounded Fallback repo-nah fest, ohne Dispatch-, Persistenz-, Surface- oder Primär-UX-Verhalten mitzubewegen
- lokal ist jetzt außerdem ein gezielter Vitest-Lauf für `__tests__/lib/maya-bluepilot-review.test.ts` verifiziert; der neue read-only Planning-/Review-Helper lief als eigener kleiner Testblock mit Exit-Code `0`
- lokal ist jetzt außerdem ein kleiner bounded UI-Folgeblock umgesetzt: `components/maya-chat-screen.tsx` surfacet den bestehenden read-only Bluepilot-Review-Helper ausschließlich sekundär innerhalb der `MayaOpsLens`, ohne Hero, ohne Primärflächen-Promotion und ohne Eingriff in Dispatch, Persistenz oder Surface-Ownership
- lokal ist jetzt außerdem die Verifikation dieses bounded Surfacing-Folgeblocks erfolgt: `npx vitest run __tests__/lib/maya-bluepilot-review.test.ts` lief grün (`4/4` Tests), und `./node_modules/.bin/tsc --noEmit --skipLibCheck` lief ohne Fehloutput
- nächster Umbauauftrag: nur dann einen weiteren engen Bluepilot-Folgeschritt schneiden, wenn der sekundäre Ops-Lens-Hinweis klar bounded und nicht-promotend bleibt; sonst den kleinen verifizierten Stand stehen lassen

### Offene Kanten

- Re-Entry ist von Arbeitsraum-, Thread- und Arbeitslauf-Detailsteuerung jetzt klarer getrennt; nach dem verifizierten read-only Planning-/Review-Helper und seinem sekundären Ops-Lens-Surfacing liegt die verbleibende offene Kante weniger in Resume-Randsemantik als eher darin, ob ein möglicher Bluepilot-Folgeschritt wirklich bounded und sekundär bleibt
- die erste Lens-/Drawer-Logik für sekundäre Inhalte ist umgesetzt, deckt aber noch nicht alle später denkbaren Nebenflächen ab
- der post-dispatch Guardrail ist bewusst heuristisch; trotz engerer Kalibrierung bleiben False Positives und False Negatives bei `overclaimWarning` und `freshnessWarning` weiter möglich
- Orb-Zustände und vergleichbare Präsenzsignale sind als Gestaltungsrichtung diskutiert, aber nicht als produktive Vollumsetzung verifiziert
- Fadenkompass-Checkpoints sind noch nicht durchgängig trigger-basiert

## Repo-sichtbar

- Mehrere Routen sind vorhanden:
  - `/`
  - `/chat`
  - `/context`
  - `/login`
  - `/maya`
  - `/supervisor`
- Mehrere API-Flächen sind vorhanden:
  - `/api/chat`
  - `/api/state`
  - `/api/maya/*`
  - `/api/supervisor/*`
  - `/api/auth/*`
  - `/api/health`
  - `/api/architect/check`
  - `/api/architect/sync`
  - `/api/architect/next`
- Zwei parallele Maya-Achsen sind im Code sichtbar:
  - Legacy/Product-State über `maya-store.ts`, `MayaStateProvider`, `/api/state`, `/api/chat`
  - separater Maya-Strang über `/api/maya/*`, `maya-provider-dispatch.ts`, `maya-memory-store.ts`, `maya-cognitive-engine.ts`
- Provider-Struktur ist im Code real vorhanden:
  - Registry in `lib/maya-provider-registry.ts`
  - Dispatch in `lib/maya-provider-dispatch.ts`
  - UI-Anbindung in `components/maya-chat-screen.tsx`
- K3-Architect-Infra ist repo-sichtbar vorhanden:
  - Routen `app/api/architect/check/route.ts`, `app/api/architect/sync/route.ts`, `app/api/architect/next/route.ts`
  - Prompt-Datei `lib/architect-prompt.ts`
  - Repo-Kontextleser `lib/repo-reader.ts`
- K4 Fokus-Screen Reordnung ist repo-sichtbar vorhanden:
  - `app/maya/page.tsx` implementiert eine fokussierte Above-the-Fold-Zone
  - Maya Brief, Next Step Hero und Context-Strip werden vor der bestehenden Runtime gerendert
  - sekundäre Sections der bestehenden `MayaChatScreen` werden auf der Fokusfläche ausgeblendet, nicht gelöscht
- K5 Block 1 Runtime-Axis-Entscheidungsnotiz ist repo-sichtbar vorhanden:
  - `docs/spec-packs/products/maya/K5_RUNTIME_AXIS_DECISION_NOTE.md`
  - beschreibt `/maya` als aktuell hybride Runtime
  - hält fest, dass Achse A derzeit Kontinuität/Persistenz trägt
  - hält fest, dass Achse B Zielpfad für neue Execution-Logik ist
  - markiert Übergangsgrenzen und Phasen für spätere K5-Folgeschritte
- K5 Block 2 Runtime-Marker sind repo-sichtbar vorhanden:
  - Achse-A-Dateien tragen `K5-LEGACY`-Marker
  - Achse-B-Dateien tragen `K5-CANONICAL`-Marker
  - `app/maya/page.tsx` trägt einen `K5-HYBRID`-Marker
  - der Block verändert kein Laufzeitverhalten, sondern markiert nur Übergangs- und Verantwortungsgrenzen
- K5 Block 3 Vorbereitungsbefund ist repo-sichtbar vorhanden:
  - `app/maya/page.tsx` trägt einen präzisierten Hybrid-Marker mit Block-3-Befund
  - die Seite liest sichtbare Kontinuitätsdaten weiter direkt über `readMayaStore()` aus Achse A
  - vorhandene `/api/maya/*`-Routen liefern derzeit keinen gleichwertigen Ersatzpfad für `activeSession`, `activeWorkspace` und `buildMayaMainSurfaceDerivation(...)`
  - in diesem Block wurde deshalb bewusst keine echte Call-Site-Umstellung durchgeführt
- K5 Block 4 Surface-State-Vertrag ist repo-sichtbar vorhanden:
  - `app/api/maya/surface-state/route.ts`
  - der Endpunkt liefert `activeSession`, `activeWorkspace` und `surface`
  - die aktuelle Implementierung ist ein Übergangsadapter und noch keine reine Achse-B-Leselogik
  - `app/maya/page.tsx` verweist im Hybrid-Marker jetzt auf diesen Vertrags-Endpunkt
  - in diesem Block wurde bewusst noch keine echte Call-Site-Umstellung durchgeführt
- K5 Block 5 erste echte Call-Site-Entkopplung ist repo-sichtbar vorhanden:
  - `app/maya/page.tsx` ruft `readMayaStore()` nicht mehr direkt auf
  - die Seite liest ihren Surface-State jetzt über `/api/maya/surface-state`
  - der serverseitige Fetch nutzt absolute URL, weitergereichte Cookies und `cache: 'no-store'`
  - der neue Leseweg ändert die Datenquelle hinter dem Vertrags-Endpunkt in diesem Block noch nicht
- K6 Design-/Architect-Kontext-Block ist repo-sichtbar vorhanden:
  - `DESIGN.md` ist als neue agent-lesbare Maya-Design-Referenz angelegt
  - `lib/repo-reader.ts` bindet `DESIGN.md` in `getArchitectContext()` ein
  - `lib/architect-prompt.ts` behandelt `DESIGN.md` als verbindliche Maya-UI-Referenz für Prüf-, Sync- und Planungsmodus
  - die Guardrails decken u.a. Presence-Farbe `#7c6af7`, Jade-Verbot `#1D9E75`, Presence-Orb-Schutz und die Grenze von maximal vier dominanten Fokus-Elementen above the fold ab
- `AGENTS.md` ist als Arbeitsgedächtnis des Agenten neu gerahmt:
  - ergänzt `README.md`, `BLUEPRINT.md` und `STATUS.md`
  - hält das Read → Act → Sync-Protokoll für Maya-Blöcke fest
- Anthropic-Abhängigkeit ist repo-sichtbar ergänzt:
  - `@anthropic-ai/sdk` in `package.json`
- Die sichtbare Produktoberfläche ist repo-sichtbar gerahmt:
  - `app/page.tsx`, `app/chat/page.tsx` und `app/maya/page.tsx` schützen `/`, `/chat` und `/maya` jeweils über `requireMayaPageAuth(...)`
  - `/` ist als dünner Maya-Gateway-Einstieg mit dominanter Primär-CTA nach `/maya` gerahmt
  - `components/primary-nav.tsx` ordnet `/maya` vor `/chat` ein
  - `/maya` wird in Navigation und UI als empfohlener Maya-Arbeitsbereich gerahmt
  - `components/maya-chat-screen.tsx` hält Arbeitslauf, Message-Feed und Composer im Primärfluss und schiebt Arbeitsraum-/Thread-Steuerung sowie Arbeitslauf-Details in eine sekundäre Ops-Lens
  - `components/maya-chat-screen.tsx` hält den neuen `epistemicGuardrail` nur als sekundären Lens-Hinweis und nicht als Primärsignal der Hauptfläche
  - `components/maya/maya-workrun-details.tsx` zeigt Mirror-/Warning-Signale nur innerhalb der Ops-Lens und reduziert aktive Handoff-Prominenz weiter auf echte Abweichungs- oder Park-/Abschlussfälle
  - `/chat` wird als älterer Pfad gerahmt und verweist im Banner sowie im Seitenpanel explizit zurück auf `/maya`
  - `/context` wird als unterstützender Kontextbereich gerahmt
  - `/supervisor` wird als interner Supervisor-Raum gerahmt
- Supervisor-Struktur ist im Code real vorhanden:
  - Route `/supervisor`
  - UI `SupervisorScreen`
  - `/api/supervisor/*`
- Die Sprachlage ist gemischt:
  - Home, Chat, Context und sichtbare Teile von Maya/Supervisor sind stärker deutsch gerahmt als zuvor
  - `login`, Teile von `maya`, Teile von `supervisor` und einzelne technische Labels bleiben weiterhin gemischt oder hart codiert
- README-/Code-Drift ist repo-sichtbar:
  - README listet die sichtbare Routenlage und ihre Produktrollen jetzt näher am UI-Zustand
  - README beschreibt `/api/health` jetzt näher am aktuellen Codezustand
  - README verweist den älteren `/chat`-Pfad weiter auf `lib/maya-engine.ts`, während `/maya` sichtbar über einen anderen Stack läuft

## Lokal verifiziert

- `git`-Stand, Branch und letzter Commit wurden lokal erhoben
- `npm --prefix maya-core run build` lief erfolgreich
- der Build listet die UI-Routen `/`, `/chat`, `/context`, `/login`, `/maya`, `/supervisor`
- der Build listet die vorhandenen API-Routen aus `app/api`
- `npm --prefix maya-core run typecheck` lief erfolgreich
- im aktuellen K3-Block lief ein schlanker lokaler TS-Check ohne Fehloutput:
  - `npx tsc --noEmit --skipLibCheck`
- K4 Fokus-Screen Reordnung ist lokal verifiziert:
  - `app/maya/page.tsx` wurde geändert
  - der enge K4-Scope blieb auf diese eine Datei begrenzt
  - `npx tsc --noEmit --skipLibCheck` lief nach der Änderung ohne Fehloutput
- K6 Design-/Architect-Kontext-Block ist lokal per TypeScript-Prüfung zu verifizieren:
  - `DESIGN.md`, `lib/repo-reader.ts`, `lib/architect-prompt.ts`, `AGENTS.md` und `STATUS.md` wurden angepasst
  - `npx tsc --noEmit --skipLibCheck` ist der vorgesehene Verifikationsschritt für diesen Block
- Post-Dispatch-Epistemic-Guardrail und Handoff-Prominence-Tightening sind lokal per TypeScript-Prüfung verifiziert:
  - `app/api/maya/chat/route.ts`, `components/maya-chat-screen.tsx` und `components/maya/maya-workrun-details.tsx` wurden angepasst
  - `npx tsc --noEmit --skipLibCheck` lief nach beiden Blöcken ohne Fehloutput
- Guardrail-Signal-Calibration ist lokal per TypeScript-Prüfung verifiziert:
  - `app/api/maya/chat/route.ts`, `components/maya-chat-screen.tsx` und `components/maya/maya-workrun-details.tsx` wurden angepasst
  - `npx tsc --noEmit --skipLibCheck` lief nach dem Kalibrierungsblock ohne Fehloutput
- Surface-State Axis Shift Follow-Up ist lokal per TypeScript-Prüfung verifiziert:
  - `lib/maya-surface-state.ts` verengt den Surface-State-Vertrag auf schmale Session-/Workspace-Anker plus `surface`
  - `components/maya-chat-screen.tsx` wurde typseitig auf den verengten Vertrag nachgezogen
  - `npx tsc --noEmit --skipLibCheck` lief nach dem Block ohne Fehloutput
- Pre-Dispatch Crush Light ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `lib/maya-provider-dispatch.ts` ergänzt den bestehenden System-Prompt vor dem Provider-Call um einen internen `Pre-Dispatch Crush Light`-Abschnitt
  - `__tests__/lib/maya-provider-dispatch.test.ts` prüft Nullfall und Kernextraktion aus der letzten User-Nachricht
  - `npx vitest run __tests__/lib/maya-provider-dispatch.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Truth-Marked Continuity Transfer Contract ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `lib/maya-thread-digest.ts` verwendet einen kleinen truth-marked Transfer-Entscheid, damit ein stale `session.digest` nicht mehr still als aktiver Kontinuitätsstand übernommen wird
  - `__tests__/lib/maya-thread-digest.test.ts` prüft den Regressionfall, dass ein `needsRefresh`-Digest auf Session-Wahrheit zurückfällt
  - `npx vitest run __tests__/lib/maya-thread-digest.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Review / Observation Closure for Runtime Focus and Continuity Truth ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-provider-dispatch.test.ts` deckt jetzt zusätzliche Fokus-Randfälle für `Pre-Dispatch Crush Light` ab
  - `__tests__/lib/maya-thread-digest.test.ts` deckt jetzt zusätzlich ab, dass stale Digest-Zustände nicht wieder in `buildMayaMainSurfaceDerivation()` einfließen
  - `npx vitest run __tests__/lib/maya-provider-dispatch.test.ts`, `npx vitest run __tests__/lib/maya-thread-digest.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Guardrail Signal Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `lib/maya-epistemic-guardrail.ts` hält jetzt die bestehende Guardrail-Heuristik als pure Helper-Datei, die weiter von `app/api/maya/chat/route.ts` genutzt wird
  - `__tests__/api/maya-chat-guardrail.test.ts` deckt Mirror-Fallback, Overclaim-Warnung, repo-geerdete Entwarnung, User-angeforderte Sicherheit sowie Freshness-Warnung mit und ohne Frischeanker ab
  - `npx vitest run __tests__/api/maya-chat-guardrail.test.ts` und `.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Real-Run Focus Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-real-run-focus-observation.test.ts` deckt das Zusammenspiel von `Pre-Dispatch Crush Light`, stale-Digest-Fallback und Guardrail-Nachspur über nah simulierte Laufspuren ab
  - ein Fall bleibt fokussiert und guardrail-ruhig, während ein zweiter Fall Guardrail-Warnsignale trotz korrektem Session-Fallback auslöst
  - `npx vitest run __tests__/lib/maya-real-run-focus-observation.test.ts` und `\.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Guardrail Signal Stability Review Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-guardrail-signal-stability-review.test.ts` deckt vier guardrail-nahe Antwortlagen über die bestehende `mirror`-/`overclaimWarning`-/`freshnessWarning`-Heuristik ab
  - ein Fall hält fest, dass `buildMirror()` einen kurzen Lead-in überspringen und auf das erste substantielle User-Segment spiegeln kann; ein zweiter Fall beobachtet, dass explizites Hedging ein absolutes Signalwort aktuell ruhig stellen kann; ein dritter Fall beobachtet, dass lokaler Workspace-/Komponenten-Kontext eine zeitnahe Formulierung ohne expliziten Commit- oder Datumsanker derzeit ruhig halten kann
  - `npx vitest run __tests__/lib/maya-guardrail-signal-stability-review.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Pre-Dispatch Crush Light Review Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-pre-dispatch-crush-light-review.test.ts` deckt vier fokusnahe Antwortlagen über `Pre-Dispatch Crush Light`, stale-Digest-Fallback und die bestehende Guardrail-Nachspur ab
  - ein Fall hält die letzte enge User-Anweisung vor älterer Breite stabil; ein zweiter Fall zeigt, dass ein request-nahes Segment innerhalb der letzten Nachricht vor bloßem Lead-in gewinnt; ein dritter Fall hält den Fallback auf den eigentlichen Druck auch ohne explizite Request-Phrase stabil; ein vierter Fall zeigt, dass driftige absolute Zeitbehauptungen trotz enger Fokusmarkierung weiter von der Guardrail-Nachspur markiert werden
  - `npx vitest run __tests__/lib/maya-provider-dispatch.test.ts __tests__/lib/maya-real-run-focus-observation.test.ts __tests__/lib/maya-pre-dispatch-crush-light-review.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Affect Posture Audit / Proposal Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-affect-posture-audit-review.test.ts` deckt drei auditnahe Antwortlagen über die aktive Affect-Naht rund um `buildTurnLocalAffectPosture()` ab
  - ein Fall hält die Affect-Naht turn-lokal und lässt die letzte User-Nachricht ältere Tonlagen übersteuern; ein zweiter Fall zeigt, dass nur ein schmaler interner `AFFEKT-CONTROL`-Hinweis statt breiterem Affect-State-Surface entsteht; ein dritter Fall hält den Affect-Pfad ohne aktuelle User-Nachricht ganz aus
  - `npx vitest run __tests__/lib/maya-affect-adapter.test.ts __tests__/lib/maya-affect-posture-audit-review.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Guardrail Edge Review Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-guardrail-edge-review.test.ts` deckt drei review-nahe Randlagen der bestehenden `mirror`-/`overclaimWarning`-/`freshnessWarning`-Heuristik ab
  - ein Fall hält fest, dass `buildMirror()` einen kurzen Lead-in überspringen und auf das erste substantielle User-Segment spiegeln kann; ein zweiter Fall beobachtet, dass explizites Hedging ein absolutes Signalwort aktuell ruhig stellen kann; ein dritter Fall beobachtet, dass lokaler Workspace-/Komponenten-Kontext eine zeitnahe Formulierung ohne expliziten Commit- oder Datumsanker derzeit ruhig halten kann
  - `npx vitest run __tests__/lib/maya-guardrail-edge-review.test.ts __tests__/lib/maya-guardrail-signal-stability-review.test.ts` und `tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Handoff / Resume Distinctness Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-handoff-resume-distinctness-observation.test.ts` deckt sowohl die semantische Trennung von `resumeActions`, Board und `handoff` als auch den bounded Kollaps bei wiederholter Thread-Wahrheit ab
  - ein Fall hält `next_step`, `open_loop`, Resume-Fokus, Board-Checkpoints und Handoff-Open-Items getrennt; ein zweiter Fall verhindert zusätzliche Signalvermehrung bei identischer Thread-Aussage
  - `npx vitest run __tests__/lib/maya-handoff-resume-distinctness-observation.test.ts` und `.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Workspace Next-Milestone Distinctness Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-workspace-next-milestone-distinctness-observation.test.ts` deckt sowohl die semantische Trennung von `goal`, `currentState`, `nextMilestone` und `openItems` als auch den bounded Kollaps bei wiederholter Thread-Wahrheit ab
  - ein Fall hält Workspace-Ziel, Zustand, nächsten Meilenstein und offene Punkte getrennt; ein zweiter Fall verhindert zusätzliche Milestone-Vermehrung bei identischer Thread-Aussage
  - `npx vitest run __tests__/lib/maya-workspace-next-milestone-distinctness-observation.test.ts` und `\.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Prioritization Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-prioritization-observation.test.ts` deckt sowohl die semantische Trennung von `primaryFocus`, `primaryNextStep` und `primaryOpenPoint` als auch die Quellenpräferenz gegenüber konkurrierenden Workspace-Fallbacks ab
  - ein Fall hält Fokus, nächsten Schritt und offenen Punkt auf der Primärfläche getrennt; ein zweiter Fall verhindert, dass Workspace-Fallbacks Workrun-/Handoff-Prioritäten verdrängen
  - `npx vitest run __tests__/lib/maya-primary-surface-prioritization-observation.test.ts` und `.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Fallback Boundary Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-fallback-boundary-observation.test.ts` deckt sowohl den Early-Thread-Fall ohne Rückleckage persistierter Signale als auch den ruhigen Thread mit tatsächlich abgeleiteten Minimal-Defaults ab
  - ein Fall hält persistierte Workrun-, Handoff-, Digest- und Workspace-Signale aus der Primärfläche heraus; ein zweiter Fall zeigt explizit, welche Defaults bei einem ruhigen Thread wirklich sichtbar bleiben
  - `npx vitest run __tests__/lib/maya-primary-surface-fallback-boundary-observation.test.ts` und `.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Quiet-Thread Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-quiet-thread-observation.test.ts` deckt leere Threads, schwache Early-Threads und ruhige, aber bereits inhaltliche Threads als drei kleine Beobachtungszustände der Primärfläche ab
  - ein Fall hält den leeren Thread auf minimalen Defaults; ein zweiter Fall hält Start-State-Leitplanken explizit von Quiet-Thread-Defaults getrennt; ein dritter Fall zeigt, dass ein stiller, aber konkreter Thread auf Thread-Wahrheit statt auf Leer- oder Start-State-Fallbacks geerdet wird
  - ein Fall hält den leeren Thread auf minimalen Defaults; ein zweiter Fall hält Start-State-Leitplanken explizit von Quiet-Thread-Defaults getrennt; ein dritter Fall zeigt, dass ein stiller, aber konkreter Thread auf Thread-Wahrheit statt auf Leer- oder Start-State-Fallbacks geerdet bleibt
  - `npx vitest run __tests__/lib/maya-primary-surface-quiet-thread-observation.test.ts` und `.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Low-Activity Repetition Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-low-activity-repetition-observation.test.ts` deckt mehrere signalarme, aber nicht leere Thread-Konstellationen samt konkurrierendem Workspace-Fallback ab
  - ein Fall hält einen einzelnen substantiellen Thread auf einem kleinen bounded Paar aus Fokus und Re-Entry; ein zweiter Fall zeigt dieselbe bounded Paarung bei assistant-geformter Low-Activity; ein dritter Fall verhindert, dass konkurrierende Workspace-Fallbacks diese begrenzte Primärpaarung überschreiben oder aufblasen
  - `npx vitest run __tests__/lib/maya-primary-surface-low-activity-repetition-observation.test.ts` und `.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Low-Activity Source-Alignment Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-low-activity-source-alignment-observation.test.ts` deckt zwei abgeleitete Low-Activity-Fälle plus einen manuellen Workspace-Abweichungsfall ab
  - ein Fall hält Fokus-, Re-Entry- und Workspace-Linie eines einzelnen substantiellen Threads konsistent ausgerichtet; ein zweiter Fall zeigt dieselbe Quellausrichtung bei assistant-geformter Low-Activity; ein dritter Fall hält manuelle Workspace-Wahrheit als explizite, von der Primärfläche getrennte Abweichung sichtbar
  - `npx vitest run __tests__/lib/maya-primary-surface-low-activity-source-alignment-observation.test.ts` und `.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Low-Activity Source-Boundary Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-low-activity-source-boundary-observation.test.ts` deckt drei erlaubte Low-Activity-Divergenzarten ab: manueller `workrun`, manueller `handoff` und manueller `workspace`
  - ein Fall zeigt, dass manueller `workrun` die Primärbahn bewusst gegen `briefing` verschieben darf; ein zweiter Fall hält eine manuelle `handoff`-Abweichung nur auf handoff-eigenen Bahnen; ein dritter Fall hält manuelle `workspace`-Wahrheit explizit von der Primärfläche getrennt
  - `npx vitest run __tests__/lib/maya-primary-surface-low-activity-source-boundary-observation.test.ts` und `.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Low-Activity Manual-Truth Precedence Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-low-activity-manual-truth-precedence-observation.test.ts` deckt drei Vorrangfälle manueller Wahrheit über signalarme Threads ab
  - ein Fall zeigt den Primärvorrang manuellen `workrun`-Truths auf Fokus- und Next-Step-Bahnen; ein zweiter Fall hält manuellen `handoff`-Truth nur auf der Open-Point-Bahn; ein dritter Fall hält manuelle `workspace`-Wahrheit sichtbar, aber sekundär, wenn `workrun` und `handoff` die Primärbahnen bereits belegen
  - `npx vitest run __tests__/lib/maya-primary-surface-low-activity-manual-truth-precedence-observation.test.ts` und `.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Low-Activity Manual-Truth Collision Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-low-activity-manual-truth-collision-observation.test.ts` deckt drei Kollisionsfälle gleichzeitiger manueller Wahrheit über signalarme Threads ab
  - ein Fall zeigt die deterministische Aufteilung der Primärbahnen bei gleichzeitig manuellem `workrun`, `handoff` und `workspace`; ein zweiter Fall hält die Kollision von manuellem `handoff`-Re-Entry und manuellem Workspace-Meilenstein unterhalb der workrun-eigenen Next-Step-Bahn; ein dritter Fall hält kollidierende workspace-eigene Wahrheit sichtbar, während `handoff` weiter die primäre Open-Point-Bahn gewinnt
  - `npx vitest run __tests__/lib/maya-primary-surface-low-activity-manual-truth-collision-observation.test.ts` und `.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Low-Activity Partial Manual-Truth Fallback Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-low-activity-partial-manual-truth-fallback-observation.test.ts` deckt drei Teil-Fallback-Fälle manueller Wahrheit über signalarme Threads ab
  - ein Fall zeigt, dass leerer manueller `workrun.nextStep` intern auf die abgeleitete workrun-eigene Next-Step-Bahn zurückfällt; ein zweiter Fall zeigt, dass leerer manueller `handoff.openItems` auf abgeleitete handoff-nahe Open-Items zurückfällt; ein dritter Fall zeigt, dass leere workspace-eigene Felder intern auf dieselben abgeleiteten Werte konvergieren können wie die Primärbahnen, ohne die manuelle Source-Ownership zu verlieren
  - `npx vitest run __tests__/lib/maya-primary-surface-low-activity-partial-manual-truth-fallback-observation.test.ts` und `\.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Low-Activity Manual-Truth Convergence Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-low-activity-manual-truth-convergence-observation.test.ts` deckt drei Konvergenzfälle manueller Wahrheit über signalarme Threads ab
  - ein Fall zeigt, dass manueller `workrun` seine manuelle Source-Ownership behält, obwohl Fokus und Next-Step mit der abgeleiteten Thread-Wahrheit übereinstimmen; ein zweiter Fall zeigt dieselbe Ownership-Stabilität für manuellen `handoff` bei konvergierender Action-Linie; ein dritter Fall zeigt, dass manueller `workspace` seine Ownership behält, obwohl Fokus, Meilenstein und Open-Point textlich mit den sichtbaren Primärbahnen zusammenfallen
  - `npx vitest run __tests__/lib/maya-primary-surface-low-activity-manual-truth-convergence-observation.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Low-Activity Source-Ownership Stability Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-low-activity-source-ownership-stability-observation.test.ts` deckt drei Stabilitätsfälle manueller Source-Ownership über signalarme Threads ab
  - ein Fall zeigt, dass manueller `workrun` nach semantisch unverändertem Persist-/Re-Derive-Zyklus manuell bleibt; ein zweiter Fall zeigt dieselbe Ownership-Stabilität für manuellen `handoff`; ein dritter Fall zeigt, dass auch manueller `workspace` nach einem semantischen No-Op-Persist-Zyklus seine manuelle Ownership behält
  - `npx vitest run __tests__/lib/maya-primary-surface-low-activity-source-ownership-stability-observation.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Low-Activity Persisted Partial-Update Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-observation.test.ts` deckt drei Teil-Update-Fälle über die Persist-Builder ab
  - ein Fall zeigt, dass ein partielles manuelles `workrun`-Update nur den Fokus ändert und den aktuellen Next-Step stabil erhält; ein zweiter Fall zeigt, dass ein partielles manuelles `handoff`-Update nur die Open-Items ändert und den aktuellen Re-Entry stabil erhält; ein dritter Fall zeigt, dass ein partielles manuelles `workspace`-Update nur die workspace-eigenen Open-Items ändert und den aktuellen nächsten Meilenstein stabil erhält
  - `npx vitest run __tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-observation.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Low-Activity Persisted Partial-Update Boundary Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-boundary-observation.test.ts` deckt drei Boundary-Fälle über die Persist-Builder ab
  - ein Fall zeigt, dass ein partielles manuelles `workrun`-Fokus-Update Fokus und nicht handoff-eigene oder open-point-nahe Bahnen verschiebt; ein zweiter Fall zeigt, dass ein partielles manuelles `handoff`-Open-Items-Update den Open-Point verschiebt, ohne workrun-eigene Fokus- oder Next-Step-Bahnen mitzuziehen; ein dritter Fall zeigt, dass ein partielles manuelles `workspace`-Open-Items-Update an der handoff-eigenen primären Open-Point-Bahn vorbeibegrenzt bleibt
  - `npx vitest run __tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-boundary-observation.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Low-Activity Persisted Partial-Update Convergence Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-convergence-observation.test.ts` deckt drei Konvergenzfälle über die Persist-Builder ab
  - ein Fall zeigt, dass ein partielles manuelles `workrun`-Fokus-Update seine manuelle Ownership behält, obwohl Fokus und Next-Step textlich mit der abgeleiteten Workrun-Spur übereinstimmen; ein zweiter Fall zeigt dieselbe Ownership-Stabilität für ein partielles manuelles `handoff`-Open-Items-Update bei konvergierender Action-Linie; ein dritter Fall zeigt, dass auch ein partielles manuelles `workspace`-Open-Items-Update seine manuelle Ownership behält, obwohl Open-Items und nächster Meilenstein textlich mit der bestehenden Workspace- und Primärspur zusammenfallen
  - `npx vitest run __tests__/lib/maya-primary-surface-low-activity-persisted-partial-update-convergence-observation.test.ts` und `npx tsc --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- Primary Surface Handoff Open-Point Boundary Observation Closure ist lokal per Test- und TypeScript-Prüfung verifiziert:
  - `__tests__/lib/maya-primary-surface-handoff-open-point-boundary-observation.test.ts` deckt eine weitere handoff-/primary-open-point-nahe Konsumkante der bestehenden Hauptableitung ab
  - der Fall hält fest, dass ein manuelles `handoff.openItems` die `primaryOpenPoint`-Bahn weiter tragen kann, ohne still von `briefing.openLoops` verdrängt zu werden, wenn die aktive Übergabespur bereits klar besetzt ist
  - `npx vitest run __tests__/lib/maya-primary-surface-handoff-open-point-boundary-observation.test.ts __tests__/lib/maya-primary-surface-prioritization-observation.test.ts` und `\.\node_modules\.bin\tsc.cmd --noEmit --skipLibCheck` liefen nach dem Block ohne Fehloutput
- auf `127.0.0.1:3000` antwortete lokal eine `maya-core`-Instanz
- lokaler Route-Smoketest auf `/`, `/maya`, `/chat`, `/context`, `/supervisor` ergab jeweils `307` auf `/login?next=...`
- `/api/health` antwortete lokal mit `200` und einem leichten JSON-Body:
  - `{"status":"ok","app":"maya-core"}`
- lokaler K3-Sync-Versuch ist belegt, aber nicht erfolgreich abgeschlossen:
  - `POST /api/auth/login` antwortete lokal mit `400` und `{"error":"invalid_request"}`
  - `GET /api/auth/session` antwortete lokal mit `200` und `{"authorized":false,"configured":true}`
  - nach dem fehlgeschlagenen Login antwortete `POST /api/architect/sync` mit `401 unauthorized`
  - damit ist die neue Architect-Infra repo-sichtbar vorhanden, aber lokal noch nicht end-to-end über den geschützten Auth-Pfad bestätigt
- lokale Provider-Keys waren zum Aufnahmezeitpunkt nicht gesetzt:
  - `OPENAI_API_KEY=False`
  - `XAI_API_KEY=False`
  - `GOOGLE_AI_KEY=False`
  - `DEEPSEEK_API_KEY=False`
  - `ANTHROPIC_API_KEY=False` für den früheren Aufnahmezeitpunkt; im aktuellen K3-Block ist `ANTHROPIC_API_KEY` lokal gesetzt
- historischer lokaler Blocker aus dem vorherigen Stand:
  - im Handoff `KERN_HANDOFF_2026-03-15.md` wurde ein lokaler bzw. umgebungsnaher Laufzeitblocker mit nicht nutzbarem App-Zugang und Auth-Misconfiguration dokumentiert
  - dieser Befund wird hier nur als lokaler Vorbefund geführt
  - dieser Befund ist nicht als aktueller Live-Zustand bestätigt

## Live-verifiziert

- Kein belastbarer live-verifizierter Zustand ist Teil dieses Packs.
- Insbesondere nicht live-verifiziert:
  - tatsächlicher Login-Durchlauf auf einer externen Instanz
  - geschützte Navigation nach Login auf externer Instanz
  - reale Provider-Antworten auf externer Instanz
  - aktueller externer Deploy-Zustand

## Unklar

- ob die lokale Instanz exakt dem gerade gebauten Stand entsprach, ist nicht separat bewiesen
- ob alle sichtbaren Kernseiten nach Login vollständig korrekt rendern, ist mit dem Redirect-Smoketest allein nicht bewiesen
- ob `/api/maya/health` und die geschützten Workspace-Flächen lokal inhaltlich korrekt funktionieren, ist in diesem Block nicht geprüft
- ob README jenseits der hier nachgezogenen Boundary-Punkte überall technisch präzise genug ist, bleibt offen
- warum der lokale Login-API-Pfad im aktuellen Stand `invalid_request` liefert, ist in diesem Block nicht abschließend isoliert
- ob die neuen `architect`-Routen lokal mit gültiger Session und realem Anthropic-Call vollständig antworten, ist noch offen

## Proposal-only

- Ein späterer einheitlicher Maya-Kanon ist möglich, aber in diesem Statusdokument nicht als bereits beschlossene Realität zu behandeln.
- Eine zukünftige Konsolidierung auf genau eine Hauptachse ist naheliegend, aber im aktuellen Repo-Stand nicht als bereits umgesetzte Realität auszugeben; K5 Block 1 definiert nur Zielpfad, Übergangsgrenzen und Folgeschritte.
- Sprachkonsolidierung auf Deutsch als klare Hauptsprache ist ein Spezifikationsziel, nicht der vollständig umgesetzte Ist-Zustand.

## Größte Driftpunkte

- Zwei parallele Maya-Achsen statt einer klaren Hauptachse
- sichtbare Produktlesart wurde klarer; K5 Block 1 benennt Achse B als Zielpfad für neue Execution-Logik, während der technische Ist-Zustand weiterhin hybrid bleibt
- README beschreibt den Stand näher am sichtbaren Produkt, aber nicht vollständig deckungsgleich mit allen technischen Flächen
- Build grün, Typecheck grün; tiefere Laufzeit- und Inhaltsverifikation bleibt dennoch offen
- gemischte de/en Sprachlage statt klarer deutscher Hauptsprache
- `/supervisor` ist nun sichtbar als interner Raum gerahmt, bleibt aber architektonisch ein Sonderraum
- Provider-Integration ist strukturell real, lokal aber mangels Keys nicht aktiv
- K3-Architect-Infra ist strukturell real, aber der lokale End-to-End-Nachweis ist durch den aktuellen Login-/Auth-Blocker noch unvollständig

## Rettungsprioritäten

- Zuerst Klarheit über den Ist-Zustand und die kanonische Ordnung, nicht technischer Ausbau
- Zuerst Trennung von:
  - aktuellem Repo-Zustand
  - offenem Zielbild
  - proposal-only Material
  - unklaren Punkten
- Zuerst explizite Benennung der parallelen Maya-Achsen
- Zuerst ehrliche Einordnung von Build grün und Typecheck grün trotz offener Laufzeit- und Inhaltsfragen
- Zuerst ehrliche Einordnung von lokalem Blocker-Vorbefund versus fehlender Live-Verifikation
