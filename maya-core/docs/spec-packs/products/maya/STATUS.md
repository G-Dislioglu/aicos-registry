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

Der lokale Build ist grün. Der lokale Typecheck ist grün. Eine lokale Instanz auf `127.0.0.1:3000` antwortete auf die sichtbaren Kernpfade mit Login-Redirects und lieferte für `/api/health` einen leichten JSON-Healthcheck. Die Sprachlage ist weiterhin gemischt de/en, aber die sichtbare Produktoberfläche rahmt `/maya`, `/chat`, `/context` und `/supervisor` klarer als zuvor. README und tatsächlicher Codezustand liegen näher beieinander, sind aber nicht identisch.

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
- Zwei parallele Maya-Achsen sind im Code sichtbar:
  - Legacy/Product-State über `maya-store.ts`, `MayaStateProvider`, `/api/state`, `/api/chat`
  - separater Maya-Strang über `/api/maya/*`, `maya-provider-dispatch.ts`, `maya-memory-store.ts`, `maya-cognitive-engine.ts`
- Provider-Struktur ist im Code real vorhanden:
  - Registry in `lib/maya-provider-registry.ts`
  - Dispatch in `lib/maya-provider-dispatch.ts`
  - UI-Anbindung in `components/maya-chat-screen.tsx`
- Die sichtbare Produktoberfläche ist repo-sichtbar gerahmt:
  - `/maya` wird in Navigation und UI als empfohlener Maya-Arbeitsbereich gerahmt
  - `/chat` wird als älterer Pfad gerahmt
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
- auf `127.0.0.1:3000` antwortete lokal eine `maya-core`-Instanz
- lokaler Route-Smoketest auf `/`, `/maya`, `/chat`, `/context`, `/supervisor` ergab jeweils `307` auf `/login?next=...`
- `/api/health` antwortete lokal mit `200` und einem leichten JSON-Body:
  - `{"status":"ok","app":"maya-core"}`
- lokale Provider-Keys waren zum Aufnahmezeitpunkt nicht gesetzt:
  - `OPENAI_API_KEY=False`
  - `XAI_API_KEY=False`
  - `GOOGLE_AI_KEY=False`
  - `DEEPSEEK_API_KEY=False`
  - `ANTHROPIC_API_KEY=False`
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

## Proposal-only

- Ein späterer einheitlicher Maya-Kanon ist möglich, aber in diesem Statusdokument nicht als bereits beschlossene Realität zu behandeln.
- Eine zukünftige Konsolidierung auf genau eine Hauptachse ist naheliegend, aber im aktuellen Repo-Stand nicht abschließend als entschiedene Wahrheit belegt.
- Sprachkonsolidierung auf Deutsch als klare Hauptsprache ist ein Spezifikationsziel, nicht der vollständig umgesetzte Ist-Zustand.

## Größte Driftpunkte

- Zwei parallele Maya-Achsen statt einer klaren Hauptachse
- sichtbare Produktlesart wurde klarer, aber die technische Hauptachse ist weiterhin nicht formal entschieden
- README beschreibt den Stand näher am sichtbaren Produkt, aber nicht vollständig deckungsgleich mit allen technischen Flächen
- Build grün, Typecheck grün; tiefere Laufzeit- und Inhaltsverifikation bleibt dennoch offen
- gemischte de/en Sprachlage statt klarer deutscher Hauptsprache
- `/supervisor` ist nun sichtbar als interner Raum gerahmt, bleibt aber architektonisch ein Sonderraum
- Provider-Integration ist strukturell real, lokal aber mangels Keys nicht aktiv

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
