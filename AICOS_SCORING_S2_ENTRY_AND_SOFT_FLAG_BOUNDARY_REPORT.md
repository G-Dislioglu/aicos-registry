# AICOS Scoring S2 Entry and Soft-Flag Boundary Report

## Status und Boundary

Dieser Block bleibt proposal-only, bounded und anti-drift.
Er baut auf dem öffentlich verifizierten Stand bis `9f95871` auf.
Die früheren öffentlichen Referenzpunkte `59391de`, `fd9cecf`, `0c50c84`, `8cf6ba5`, `388094a`, `5b7ecbb` und `6a33235` bleiben dabei unverändert.
SMT bleibt Freeze / not-now.

Die jetzt öffentlich geschärften Studio-Grenzen sind hier nur Vorbedingung, nicht Gegenstand.
Sie haben die menschliche Review-Linie geklärt.
Der nächste sinnvolle Druckpunkt liegt deshalb auf der Scoring-Seite: nicht S2 bauen, sondern die Eintrittsfrage klein und die Soft-Flag-Grenzen lesbar halten.

## Warum diese Kombination als gemeinsamer Block sinnvoll ist

Die S2-Eintrittsfrage kann nicht sauber beantwortet werden, wenn unklar bleibt, wie die bestehende Soft-Flag-/Review-Linie an Grenzfällen gelesen wird.

Wenn S2 isoliert diskutiert würde, entstünde schnell Modellhunger:
- mehr Felder
- mehr Semantik
- mehr vermeintliche Präzision

Wenn nur Soft-Flag-Fälle gebaut würden, bliebe umgekehrt offen, ob diese Leseschärfung überhaupt eine spätere S2-Frage legitimiert.

Darum bündelt dieser Block beides:
- die harte Frage, wann S2 überhaupt erwogen werden dürfte
- die kleine Praxisfrage, wie die bestehende Soft-Flag-Klassifikation an Grenzfällen gelesen werden sollte

## Welche Entry-Bedingungen für S2 geprüft wurden

Geprüft wurden ausschließlich enge Eintrittsbedingungen.
Nicht ein S2-Design.

Die geprüften Bedingungen sind:
- echte Interpretationslücke statt bloßem Unbehagen an Ausnahmen
- lesbare und wiederholbare Soft-Flag-Grenzen vor jeder S2-Ausweitung
- explizite Semantik jeder möglichen Zusatzachse vor jeder Datenarbeit
- keine stille Backfill- oder Mutationslogik
- strikte Trennung von Runtime, MEC, Operator und Policy
- Nutzen kleiner als Drift-Fläche

Das Ergebnis ist bewusst restriktiv:
S2 ist damit nicht freigegeben.
Es ist nur enger blockiert und präziser formulierbar.

## Welche Soft-Flag-Grenzen getestet wurden

Der Korpus testet genau sechs kleine Boundary-Fälle:
- 2 klare Fälle für `likely_overvaluation`
- 2 klare Fälle für `justified_exception`
- 2 echte Grenzfälle für `borderline_but_defensible`

Die Mitte ist dabei absichtlich eng gehalten.
`borderline_but_defensible` ist hier keine bequeme Restkategorie.
Es ist nur dort zulässig, wo gleichzeitig ein reales Overvaluation-Signal und ein reales Defensibility-Signal benannt werden können und beide Adjacent-Rejections lesbar bleiben.
Sobald eine Seite klar dominiert, soll die Klassifikation wieder zurück auf `likely_overvaluation` oder `justified_exception` fallen.

Die getesteten Spannungen sind:
- `proposed_high_confidence` mit rein synthetischer Evidenz
- `proposed_high_confidence` mit ungewöhnlich konkreten Zahlen
- `confidence_95_plus` bei eng gebundenen Fehler- oder Lösungsflächen
- `value_95_plus` bei lokal sehr starken, aber nicht offensichtlich registry-zentralen Lösungen

Wichtig ist dabei:
`borderline_but_defensible` wird hier nicht als neue Scoring-Klasse eingeführt.
Es ist nur die maschinenlesbare Form der bereits vorhandenen Review-Sprache `borderline but defensible`.

## Was robust ist

Robust ist die bestehende S1-Linie dort, wo sie bereits klein und diszipliniert ist:
- die bestehende `impact`-Triade bleibt ausreichend für den aktuellen Stand
- die Hygiene-Flags sind scharf genug, um problematische Extremzonen sichtbar zu machen
- menschliche Review kann proposal-level inflation oft gut von bounded operational confidence trennen
- S2 lässt sich bereits vor dem Bau sinnvoll begrenzen, ohne neue Ontologie einzuführen

## Wo Drift- und Übertheorisierungsrisiko bleibt

Drift-Risiko bleibt an vier Stellen:
- konkrete Zahlen in einem Proposal können falsche Härte suggerieren
- lokale operative Nützlichkeit kann wie registry-weite Ausnahmestärke gelesen werden
- Soft-Flag-Labels können zu schnell wie Policy-Labels klingen
- der Wunsch nach S2 kann aus Deutungsunbehagen entstehen, nicht aus echter Semantiklücke

Am empfindlichsten bleibt dabei die Mitte.
Wenn `borderline_but_defensible` nicht durch explizite doppelseitige Begründung und explizite Adjacent-Rejection gebunden bleibt, wird das Label zur bequemsten Drift-Zone des ganzen Blocks.

Genau deshalb bleibt der Block absichtlich klein.
Er reduziert Grenzunschärfe.
Er rechtfertigt noch keinen Ausbau.

## Was der Block NICHT beweist

Dieser Block beweist ausdrücklich nicht:
- kein S2-Build
- keine neue Scoring-Klasse
- keine automatische Threshold-Politik
- keine neue Policy-Engine
- keine neue Ranking- oder Promotion-Semantik
- keine Runtime-, MEC-, Operator- oder Provider-Integration
- keine Registry-, Alias- oder Index-Mutation
- keine SMT-Rückkehr
- keine Pflicht zur Entfernung symbolischer Ausnahmen innerhalb von S1

## Fazit

Der Block beantwortet nicht die Frage, wie S2 gebaut werden sollte.
Er beantwortet nur zwei engere Vorfragen:
- wann S2 überhaupt ernsthaft erwogen werden dürfte
- wie die bestehende Soft-Flag-/Review-Linie an wenigen Grenzfällen lesbar bleibt

Genau deshalb ist dies ein sinnvoller größerer Folgeblock nach der öffentlichen Studio-Schärfung.
