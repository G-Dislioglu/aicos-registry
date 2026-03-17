# BLUEPRINT

## Zweck

Dieses Dokument beschreibt das Maya-Zielbild als Ordnungs- und Architekturrahmen.

Es beschreibt nicht den vollständigen aktuellen Implementierungszustand.

## Aktueller Architekturstatus

Der aktuelle Architekturstatus ist uneinheitlich.

Im sichtbaren `maya-core`-Stand existieren mehrere Routen und mehrere Daten- bzw. Laufzeitachsen, die nicht als eine einzige saubere Hauptachse beschrieben werden können.

Insbesondere sichtbar:
- ein Legacy/Product-State-Strang über `/api/state` und `/api/chat`
- ein separater Maya-Strang über `/api/maya/*`
- zusätzliche Supervisor-Flächen über `/supervisor` und `/api/supervisor/*`

## Grundsatz

Maya braucht genau eine kanonische Hauptachse.

Diese Hauptachse soll den primären Maya-Raum, seine Kerninteraktion und die zugehörige Hauptlogik eindeutig tragen.

## Primärraum

Der Primärraum ist der Raum, in dem Maya als Hauptarbeitsfläche erscheint.

Pflichtmerkmale des Primärraums:
- klarer Produkteinstieg
- klare Hauptinteraktion
- keine konkurrierende zweite Primärfläche
- klare Zuordnung von Runtime- und Datenpfad

### Aktueller Stand

- Eine belastbar entschiedene kanonische Hauptachse ist im Repo nicht abschließend als formale Entscheidung dokumentiert.
- `/maya` ist ein naheliegender Kandidat für den Primärraum.
- Dieser Kandidatenstatus ist repo-sichtbar plausibel, aber nicht als endgültig beschlossene Wahrheit dieses Dokuments zu behandeln.

### Status

`offen`

## Sekundärräume

Sekundärräume sind unterstützende Maya-Räume ohne Anspruch, selbst das Primärsystem zu sein.

Naheliegende Sekundärräume im aktuellen Stand:
- `/context` als Kontext-, Profil- und Memory-Raum
- mögliche begleitende Übersichts- oder Stützflächen

### Status

Teilweise sichtbar, aber nicht vollständig kanonisch geordnet.

## Legacy-Räume

Legacy-Räume sind weiter vorhandene Räume, die aus früheren Maya-Zuständen stammen oder von älteren Produktpfaden getragen werden.

Im aktuellen Stand ist `/chat` als Legacy-Kandidat sichtbar.

Das bedeutet nicht automatisch, dass `/chat` bereits formell deprectated, abgeschaltet oder umgeleitet ist.

### Status

`repo-sichtbar vorhanden`

## Verborgene oder interne Räume

Verborgene oder interne Räume sind nicht zwingend Primär- oder Nutzersurfaces, können aber systemisch relevant sein.

Im aktuellen Stand zählen dazu insbesondere:
- `/api/maya/*`
- `/api/supervisor/*`
- interne Provider-, Memory- und Review-Pfade

Diese Räume sind nicht mit der sichtbaren kanonischen Maya-Hauptachse gleichzusetzen.

## Architekturregeln

- Es darf nicht zwei konkurrierende Primärsysteme geben.
- Legacy und Zielpfad müssen klar getrennt werden.
- Eine unterstützende oder interne Fläche darf nicht stillschweigend das Primärsystem ersetzen.
- Eine sichtbare UI-Fläche und ihr Datenpfad sollen zusammenhängend und klar lesbar sein.
- Proposal-only Architekturregeln dürfen nicht als bereits umgesetzte Realität ausgegeben werden.

## Offene Architekturfragen

- Welche Route ist formal die kanonische Hauptachse von Maya?
- Bleibt `/chat` dauerhaft Legacy-Raum, oder ist ein anderer Status vorgesehen?
- Welche Rolle hat `/supervisor` im Maya-Ordnungsmodell?
- Soll der Product-State-Strang erhalten, migriert oder klar isoliert werden?
- Welche Achse trägt langfristig die maßgebliche Maya-Hauptinteraktion?
