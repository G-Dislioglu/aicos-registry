# BLUEPRINT

## Zweck

Dieses Dokument beschreibt das Maya-Zielbild als Ordnungs- und Architekturrahmen.

Es beschreibt nicht den vollständigen aktuellen Implementierungszustand.

## Produktentscheidung für `maya-core`

Für das Produkt `maya-core` gilt: `/maya` ist die primäre Maya-Oberfläche.

Maya ist als Companion Surface zu führen — nicht als Dashboard und nicht als Tool-Board.

Diese Entscheidung ordnet die sichtbare Produktlinie in `maya-core`. Sie behauptet nicht, dass bereits jede technische Achse vollständig konsolidiert oder jede Spezifikationsschicht außerhalb dieses Dokuments aktualisiert ist.

## Kanonische Hauptachse

**Entschieden: `/maya` ist die primäre Maya-Oberfläche in `maya-core`.**

Maya ist eine Companion Surface.

Primärinteraktion: orientieren · spiegeln · weiterführen · fokussieren

Sekundäres gehört in unterstützende Räume oder ausgelagerte Detailflächen, nicht in eine konkurrierende Hauptoberfläche.

### Raumlogik

| Raum | Rolle | Status |
|---|---|---|
| `/maya` | Primär — Companion Surface | Produktentscheidung für `maya-core` |
| `/chat` | Legacy/explorativ | Nicht mehr gleichrangig |
| `/context` | Sekundär — Kontext-Raum | Unterstützend |
| `/supervisor` | Intern — Sonderraum | Kein Primär-UX |

### UI/UX-Grundprinzip

- Zuerst klare Hauptführung, dann tiefe Werkzeuge
- Keine doppelte Primäroberfläche
- Kein Dashboard-Drift: keine dauerhaften gleichrangigen Panels auf der Hauptfläche
- Companion Surface hat genau eine klar erkennbare Primäraktion
- Sekundäres ist eingeklappt, ausgelagert oder in einer Lens/Drawer-Logik untergebracht

### AICOS-Anschluss

Maya folgt dem Mirror-Prinzip (`meta-001`): erst spiegeln, dann führen.

Regime-Exit-Logik (`meta-003`): Screen-Wechsel sind definierte Exits mit Trigger und Carry-Forward.

Context-Decay-Defense (`err-cross-001`): Fadenkompass als aktiver Checkpoint statt passiver Deko.

Companion Surface Doctrine (`sol-maya-001`): Trennung von führender Fläche und technischem Detail.

## Nicht-Ziele dieser Produktlinie

- Kein gleichrangiges Feature-Dashboard
- Keine konkurrierende Primäroberfläche neben `/maya`
- Keine Motion/Rive/Council/Intent-Resolver als Pflicht der aktuellen Produktlinie
- Keine implizite Gleichsetzung interner oder technischer Flächen mit der sichtbaren Hauptoberfläche

## Sichtbarer aktueller Architekturstand

Der aktuelle sichtbare `maya-core`-Stand bleibt technisch uneinheitlich.

Im Repo bestehen weiterhin mehrere Daten- und Laufzeitachsen, insbesondere:
- ein Legacy/Product-State-Strang über `/api/state` und `/api/chat`
- ein separater Maya-Strang über `/api/maya/*`
- zusätzliche Supervisor-Flächen über `/supervisor` und `/api/supervisor/*`

Die Produktentscheidung für `/maya` hebt diese technische Drift nicht automatisch auf. Sie definiert die Ziel- und Ordnungslogik, an der weitere Umbauten auszurichten sind.

## Architekturregeln

- Es darf nicht zwei konkurrierende Primärsysteme geben.
- Legacy und Zielpfad müssen klar getrennt werden.
- Eine unterstützende oder interne Fläche darf nicht stillschweigend das Primärsystem ersetzen.
- Eine sichtbare UI-Fläche und ihr Datenpfad sollen zusammenhängend und klar lesbar sein.
- Proposal-only Architekturregeln dürfen nicht als bereits umgesetzte Realität ausgegeben werden.

## Weiterhin offene Architekturfragen

- Wie wird die bestehende technische Parallelität zwischen `/api/state`/`/api/chat` und `/api/maya/*` schrittweise konsolidiert?
- Welche Detailflächen bleiben dauerhaft unter `/context` und welche wandern in eine Lens-/Drawer-Logik von `/maya`?
- Welche Rolle hat `/supervisor` langfristig im Maya-Ordnungsmodell?
- Welche Achse trägt langfristig die maßgebliche Maya-Hauptinteraktion im Runtime-Sinne?
