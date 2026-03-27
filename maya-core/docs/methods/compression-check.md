# Compression / Resonance Check — Methodenreferenz

## Zweck

Problemnebel reduzieren, Hebel lokalisieren, Scheinarbeit stoppen.

Dieses Dokument erklärt die Methode. Die Kurzversion für den Arbeitsalltag
steht in `AGENTS.md` unter "Zerquetsch-Disziplin".

## Grundprinzip

Du verstehst ein Problem erst, wenn du weißt was du nicht wegstreichen kannst.
Du weißt was du damit tun sollst, indem du dagegen drückst und beobachtest
ob es kippt, sich biegt, bleibt oder täuscht.

Das ist die gesamte Methode. Alles Weitere sind Varianten und Werkzeuge.

## Modi

### Crush (Zerquetschen)

Wofür: Diffuse Probleme, Architektur-/Verantwortungsfragen, Hybridzustände,
semantische Unschärfe, Fälle mit viel Schutt.

Leitfrage: "Was bleibt wahr, wenn ich fast alles andere wegstreiche?"

Tiefere Variante — Fünffach-Streichtest:
1. Varianten streichen: Was bleibt egal wie man es formuliert?
2. Harmonie streichen: Wo ist der Widerspruch der sich nicht auflöst?
3. Nebenschauplätze streichen: Was blockiert alles andere?
4. Negation: Was ist es definitiv NICHT?
5. Kategorie streichen: Ist die Schublade selbst fragwürdig?

Output: Ein unzerstörbarer Kern-Satz mit Spannung.
Wenn der Satz sich elegant und rund anfühlt, wurde destilliert statt zerquetscht. Nochmal.

Schwäche: Gibt oft noch keine Richtung. Kann in elegante aber zu abstrakte Sätze kippen.

### Press (Drücken)

Wofür: Wenn bereits ein scharfer Kern vorliegt und geprüft werden soll ob er operativ reagiert.

Leitfrage: "Welche kleinste Gegenoperation würde diesen Kern sichtbar angreifen?"

Wichtig: Nicht bloß sprachlich umkehren, sondern eine operative Gegenbewegung formulieren.

Output: Reaktionsklasse (kippt/biegt/bleibt/täuscht) + plausible Eingriffsfläche.

Schwäche: Schlechte Kerne werden nur schlecht gedrückt. Reine Inversion reicht nicht.

### Provoke (Provokation)

Wofür: Nutzernahe Probleme, UX/Flow/Friktion, alles mit realem Failure-Mode.

Leitfrage: "Wenn das morgen 10x schlimmer wird, was geht genau kaputt?"

Output: Bruch/Erosion/Bedingung + Schutzrichtung.

Wichtig: Schutzrichtung ist nicht die Lösung, sondern die Richtung.

Schwäche: Presst zu viel in ein Bruchschema. Dramatisiert gern. Architekturfragen werden
falsch als Bruchproblem gelesen.

### Remove (Entfernen)

Wofür: Verdacht auf unnötige Komplexität, UI-Ballast, doppelte Logik, fragwürdige Zusatzschichten.

Leitfrage: "Wenn wir das komplett entfernen, was verlieren wir real?"

Output: Tatsächlicher Verlust + Keep/Drop-Tendenz.

Schwäche: Kann leise aber wichtige Infrastruktur unterschätzen. "Nicht sichtbar" ≠ "unnötig".

### Relocate (Verlagern)

Wofür: Pre-/Post-Dispatch, UI vs Runtime, State vs Prompt, Review vs Live-Flow.

Leitfrage: "Ist das Problem falsch gelöst, oder nur am falschen Ort gelöst?"

Output: Wohin es eher gehört + Move/Keep-Tendenz.

Schwäche: Bloßes Verschieben statt echtes Lösen.

## Reaktionsklassen

### kippt
Die Gegenoperation trifft direkt den Hebel.
→ Echtes Problem, wirksame Interventionsfläche. Klein bauen, schnell prüfen.

### biegt
Es reagiert, aber erzeugt sofort einen neuen Widerstand.
→ Tradeoff. Neuen Widerstand separat zerquetschen.

### bleibt
Es passiert nichts Relevantes.
→ Kein Produkthebel, falscher Kern, falscher Test, oder Bedingung.
Nicht automatisch "nur eine Bedingung" — es kann auch bedeuten: falscher Hebel,
falsche Abstraktion, zu weit weg von der Nutzerebene.

### täuscht
Es fühlt sich nach Fortschritt an, aber der Nutzereffekt bleibt gleich.
→ Falsche Aktivität, Scheinerfolg. Ausbau sofort stoppen.
Das ist die gefährlichste Klasse, weil sie sich wie Arbeit anfühlt.

## Moduswahl

- `crush` bei diffusen/hybriden/semantisch überladenen Problemen
- `provoke` bei UX-/Flow-/Friktions-/Bruchproblemen
- `relocate` bei Verdacht auf falschen Ort
- `remove` bei Ballast-/Redundanzverdacht
- `press` nur nach brauchbarem Kern, nie als erster Schritt

## Prüfformat für RADAR-Kandidaten

Wenn ein RADAR-Kandidat geprüft wird, verwende mindestens:

- `mode`: welcher Modus wurde angewendet
- `reaction_class`: kippt / biegt / bleibt / täuscht
- `direction`: Eingriffs- oder Schutzrichtung (nicht die Lösung selbst)
- `why_not_more`: was beweist dieses Ergebnis NICHT

## Harte Regeln

- Kein Modus ist universell.
- `direction` ist nicht automatisch die Lösung.
- Sichtbare Aktivität ohne Nutzereffekt zählt nicht als Fortschritt.
- `täuscht` nicht ausbauen.
- `bleibt` heißt: Kern oder Modus neu prüfen.
- Keine stillen Scope-Sprünge aus der Diagnose ableiten.
- Nicht jede gute Diagnose rechtfertigt einen Build-Schritt.
- Eintrag ohne `why_not_more` ist unvollständig.

## Abbruchregel

Wenn zwei Prüfschritte hintereinander nur generische Sätze erzeugen
ohne neue Interventionsfläche oder klare Reaktionsklasse:
stoppen, nicht weiter verfeinern.

## Herkunft

Entwickelt in einem Claude-Chat (März 2026) aus der Kreuzung von:
- Eidetische Reduktion (Husserl) — Invarianz durch Wegstreichen
- Dialektischer Widerspruch (Hegel) — Spannung als Motor
- Theory of Constraints (Goldratt) — ein Engpass statt vieler Optimierungen
- Apophatik (Negative Theologie) — Erkenntnis durch Ausschließen
- Problematisierung (Foucault) — die Kategorie selbst hinterfragen

Verfeinert durch ChatGPT-Gegenprüfung:
- "Täuscht" als vierte Reaktionsklasse ergänzt
- Drei Testarten statt nur Inversion (Entfernen, Verlagern)
- "Schutzrichtung ≠ Lösung" als Korrektur
- "Kein Modus ist universell" als Guardrail
