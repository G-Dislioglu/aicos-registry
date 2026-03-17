# CONTINUITY

## Zweck

Diese Datei beschreibt Kontinuitätsregeln als Spezifikations- und Zielrahmen.

Sie beschreibt nicht den vollständigen aktuellen Implementierungszustand von `maya-core`.

## Global Shared Memory

Global Shared Memory bezeichnet den engsten gemeinsamen, systemübergreifend tragfähigen Erinnerungskern.

Dort darf nur Material liegen, das für mehrere Räume legitim geteilt werden darf und dessen Wahrheitsstatus klar ist.

## Shared Working Memory

Shared Working Memory bezeichnet gemeinsam nutzbare Arbeitskontexte über mehrere Räume hinweg.

Es ist näher an aktiver Arbeit als am kanonischen Kern und darf daher nicht mit allgemeiner Wahrheit verwechselt werden.

## App-local Domain Memory

App-local Domain Memory bezeichnet fach- oder produktraumspezifisches Erinnerungsmaterial innerhalb einer einzelnen App oder Domäne.

Dieses Material bleibt an die Grenzen, Begriffe und Rechte des jeweiligen Raums gebunden.

## App-local Runtime State

App-local Runtime State bezeichnet flüchtigen oder laufzeitnahen Zustand einer konkreten Erscheinung.

Er ist die lokalste und am wenigsten verallgemeinerbare Schicht.

## Regeln für Raumwechsel

- Ein Raumwechsel darf den Wahrheitsstatus eines Objekts nicht stillschweigend erhöhen.
- Ein Raumwechsel darf lokale Laufzeitfragmente nicht automatisch in geteiltes Memory verwandeln.
- Ein Raumwechsel braucht klare Übergangsobjekte oder klare Begrenzung.
- Was nur in einem Raum gültig ist, bleibt dort gebunden, bis eine explizite Überführung legitimiert ist.

## Übergangsobjekte

Übergangsobjekte sind klar benannte Objekte, die Kontext zwischen Räumen transportieren dürfen.

Sie müssen mindestens tragen:
- Herkunftsraum
- Zielraum oder Zielklasse
- Wahrheitsstatus
- Zweck der Übergabe
- eventuelle Begrenzungen oder Vorläufigkeit

## Verbotene Formen von Kontexttransfer

Verboten sind insbesondere:
- stiller Export von app-local Runtime State in globale Wahrheit
- unmarkierte Vermischung von Proposal und Kanon
- Übertragung ohne Herkunfts- und Wahrheitsmarkierung
- Cross-App-Kontexttransfer mit verdeckter Schreibwirkung
- Umdeutung lokaler Assistenzartefakte zu systemischer Wahrheit ohne expliziten Übergang
