# STATUS

## Zweck

Diese Datei hält den aktuellen Maya-Zustand für `maya-core` fest.
Sie trennt strikt zwischen beobachtbarem Ist-Zustand, lokaler Verifikation, live-verifiziertem Zustand, unklaren Punkten und proposal-only Material.

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

Der lokale Build ist grün. Ein früherer voller lokaler Typecheck lief grün; im aktuellen K3-Block wurde stattdessen ein schlanker `tsc --noEmit --skipLibCheck`-Check ohne Fehloutput verwendet, weil der volle Typecheck im laufenden Windsurf-Setup hängen kann. Eine lokale Instanz auf `127.0.0.1:3000` antwortete auf die sichtbaren Kernpfade mit Login-Redirects und lieferte für `/api/health` einen leichten JSON-Healthcheck. Die Sprachlage ist weiterhin gemischt de/en, aber die sichtbare Produktoberfläche rahmt `/maya`, `/chat`, `/context` und `/supervisor` klarer als zuvor. README und tatsächlicher Codezustand liegen näher beieinander, sind aber nicht identisch. K3-Infra-Artefakte für einen internen Architect-Block sind nun repo-sichtbar angelegt. K4 Fokus-Screen Reordnung ist repo-sichtbar umgesetzt und lokal per TypeScript-Prüfung verifiziert: `app/maya/page.tsx` rendert jetzt eine Fokus-Zone mit Maya Brief, Next Step Hero, Context-Strip und vorgelagertem Composer-Verhalten, während sekundäre Sections auf der Fokusfläche ausgeblendet bleiben. K5 Block 1 ist nun repo-sichtbar als Dokumentationsentscheid angelegt: Die aktuelle `/maya`-Runtime wird explizit als Hybrid aus Achse A (Kontinuität/Persistenz) und Achse B (Execution/Provider) beschrieben; Achse B ist als Zielpfad für neue Execution-Logik benannt, ohne bereits eine vollständige technische Ein-Achsen-Umstellung zu behaupten. K5 Block 2 ist nun repo-sichtbar als Marker-Block angelegt: Legacy-/Canonical-Kommentare markieren die betroffenen Achsen-Dateien, und `app/maya/page.tsx` trägt einen Hybrid-Marker an der sichtbaren Zusammenführung, ohne Verhaltensänderung zu behaupten. K5 Block 5 ist repo-sichtbar als erste echte Call-Site-Entkopplung umgesetzt: `app/maya/page.tsx` liest seinen Surface-State nun über `/api/maya/surface-state`. K6 ist repo-sichtbar als Design-/Architect-Kontext-Block ergänzt: `DESIGN.md` definiert jetzt eine agent-lesbare Maya-Design-Wahrheit, und der interne Architect-Kontext liest diese Referenz bei Bewertungen mit.

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
- `npm --prefix maya-core run typecheck` lief nach dem Downshift erfolgreich
- nächster Umbauauftrag: ein weiterer enger UI-Folgeblock zur Reduktion verbleibender Wiedereinstiegs-/Handoff-Prominenz oder alternativ ein kleiner K5-Folgeblock zur internen Surface-State-Verschiebung Richtung Achse B

### Offene Kanten

- Re-Entry ist von Arbeitsraum-, Thread- und Arbeitslauf-Detailsteuerung jetzt klarer getrennt, aber Handoff-/Wiedereinstiegsdetails können bei Abweichung weiterhin relativ prominent werden
- eine erste Lens-/Drawer-Logik für sekundäre Inhalte ist umgesetzt, deckt aber noch nicht alle später denkbaren Nebenflächen ab
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
