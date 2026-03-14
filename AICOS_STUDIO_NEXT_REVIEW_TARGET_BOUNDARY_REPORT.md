# AICOS Studio Next Review Target Boundary Report

## Status und Boundary

Dieser Block ist proposal-only, bounded und anti-drift.
Er stützt sich auf die öffentlich verifizierten Referenzpunkte `59391de`, `fd9cecf`, `0c50c84`, `8cf6ba5`, `388094a` und `5b7ecbb`.

`5b7ecbb` bleibt dabei der aktuell neueste öffentlich verifizierte Referenzpunkt.
SMT bleibt vorerst Freeze und ist nicht Teil dieses Blocks.

Der lokale Re-Priorisierungsstand hat `K2 — Studio Next Review Target Boundary Cases` als nächsten Block gesetzt.
Dieser Report setzt diese Startentscheidung um, ohne die Re-Priorisierung neu aufzumachen.

## Welche Zielgrenzen wurden getestet

Getestet wurden genau die bestehenden Zielgrenzen innerhalb der vorhandenen `next_review_target`-Logik:

- `manual_design_followup` vs. `request_human_decision`
- `request_human_decision` vs. `human_registry_review`
- Fälle, in denen eine zu aggressive Zielwahl unnötige Eskalation wäre
- Fälle, in denen eine zu schwache Zielwahl reale spätere Prüfpflicht verdecken würde

Nicht getestet wurden neue Zielklassen, Runtime-Ziele, MEC-Ziele oder Registry-Mutationen.

## Warum genau diese 6 Fälle

Die sechs Fälle sind kein Mengenblock, sondern ein kleiner Boundary-Korpus mit klarer Verteilung:

- 2 klare Fälle für `manual_design_followup`
- 2 klare Kipppunkte in Richtung `request_human_decision` oder `human_registry_review`
- 2 echte Ambiguitätsfälle, bei denen die Zielwahl ohne harte Grenzlogik leicht driftet

Die Auswahl deckt genau die Stellen ab, an denen die vorhandene Studio-Linie praktisch ausfranst:

- lokale Design- und Review-Surface-Fragen, die nicht vorschnell eskaliert werden dürfen
- echte Human-Eskalationsfragen, die nicht im lokalen Follow-up versanden dürfen
- bestehende Card-Grenzfälle, die nach menschlicher Registry-Prüfung riechen, aber nicht immer schon reif genug dafür sind

## Sichtbares Muster

Das Muster ist klar:

- `manual_design_followup` bleibt richtig, wenn der Fall noch primär Packet-, Review-Surface- oder lokale Boundary-Form betrifft
- `request_human_decision` wird richtig, wenn nicht mehr nur Designpflege, sondern die begrenzte Frage einer späteren menschlichen Eskalation selbst entschieden werden muss
- `human_registry_review` wird erst dann sauber, wenn ein bestehender Card- oder Registry-Grenzfall mit ausreichender bounded Evidenz und sichtbarer Konfliktlage vorliegt

Die Hauptdrift entsteht nicht durch völlig falsche Zielklassen, sondern durch zu frühe oder zu späte Eskalation entlang genau dieser drei bestehenden Ziele.

## Wo die bestehende Logik robust ist

Robust ist die bestehende Logik dort, wo die Fallart klar ist:

- frühe oder noch formende Designfragen bleiben sauber bei `manual_design_followup`
- echte Carry-forward-Entscheidungen mit später Human-Last kippen belastbar zu `request_human_decision`
- klar abgegrenzte bestehende Card-Fälle mit besserer Evidenz tragen `human_registry_review` ohne neue Zielklasse

Dafür reicht der vorhandene Studio-Rahmen bereits aus.
Es war keine neue Ontologie nötig.

## Wo noch Drift-Risiko bleibt

Drift-Risiko bleibt vor allem an zwei Kanten:

- wenn Review-Surface- oder Sichtbarkeitsprobleme schon nach Eskalation riechen, aber noch keine echte Human-Entscheidungslast tragen
- wenn ein bestehender Card-Bezug sichtbar ist, die Evidenz- und Konfliktlage aber noch nicht stabil genug für `human_registry_review` ist

Genau dort drohen die typischen Fehlgriffe:

- unnötige Eskalation von lokaler Designarbeit zu `request_human_decision`
- vorschneller Sprung von gemischter Falllage zu `human_registry_review`
- zu schwache Zielwahl bei realer später Prüfpflicht

## Was dieser Block NICHT beweist

Dieser Block beweist ausdrücklich nicht:

- dass `next_review_target` künftig automatisch entschieden werden kann
- dass jede Ambiguität mit sechs Fällen vollständig geschlossen ist
- dass `request_human_decision` oder `human_registry_review` schon autorisiert wären
- dass Registry- oder Runtime-Wahrheit berührt werden darf
- dass SMT, Pilot, O8, Operator oder Integration wieder geöffnet werden sollten

## Closure

Der Block schärft die Grenzen der bestehenden `next_review_target`-Logik mit kleinem bounded Korpus.
Er baut keine neue Zielklasse und keine neue Theorie.
Er macht vor allem sichtbarer, wann eine stärkere Zielwahl wirklich nötig ist und wann sie nur Eskalationsdrift wäre.
