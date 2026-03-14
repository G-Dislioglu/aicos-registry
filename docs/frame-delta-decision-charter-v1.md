# Frame Delta Decision Charter v1

## Status und Boundary

Diese Charter ist eine proposal-only, bounded, anti-drift Entscheidungscharter für den Frame-Delta-Track.
Sie leitet sich ausschließlich aus den öffentlich verifizierten Referenzpunkten `59391de`, `fd9cecf` und `0c50c84` ab.

Diese Charter ist:

- lokal interpretierbar
- shadow-only
- non-authoritative
- evidenzgebunden an Batch 1 und Batch 2

Diese Charter ist nicht:

- eine Default-Policy für Studio
- eine Integrationsfreigabe
- eine automatische Trigger- oder Eskalationslogik
- eine zweite Autoritätsoberfläche
- eine Rechtfertigung für Runtime-, Registry- oder Studio-Mutation

## Zweck des Delta-Tracks

Der Frame-Delta-Track soll dort zusätzlichen Framing-Druck liefern, wo die bounded Oberfläche mehr Sicherheit, Abschluss oder Autorität suggeriert, als die Evidenz tatsächlich trägt.
Er soll helfen, versteckte Haltungsdrift, falsche Kohärenz und vorschnellen Abschluss sichtbar zu machen.

## Was Delta leisten soll

Delta soll:

- versteckte Settled-, Approval- oder Authority-Haltung unter lokaler Oberfläche sichtbar machen
- False Coherence und Premature Closure unter glatter Harmonisierung aufbrechen
- Signal-Gaps expliziter machen, wenn die Baseline diese zu höflich oder zu glatt behandelt
- die Baseline mit einer zusätzlichen Shadow-Lesart vergleichen, ohne sie still zu ersetzen

## Was Delta ausdrücklich nicht leisten soll

Delta soll nicht:

- als Default-Layer über alle bounded Fälle gelegt werden
- die Baseline automatisch überstimmen
- eine automatische Invoke-Regel erzeugen
- Integration in Studio begründen
- Brücken in Autoritäts-, Runtime- oder Registry-Flächen legitimieren

## Entscheidungszonen

### `invoke_likely`

Delta ist wahrscheinlich sinnvoll, wenn mindestens eine dieser Lagen sichtbar ist:

- lokal wirkende Sprache trägt versteckte Settled-, Approval- oder Authority-Postur
- Harmonisierung oder Aufräumlogik komprimiert lebenden Widerspruch in zu glatte Kohärenz
- die Oberfläche bleibt formal bounded, behauptet aber implizit mehr Sicherheit als belegt ist
- die Baseline wirkt in der Falllesart zu höflich gegenüber versteckter Postur-Drift oder False Coherence

### `invoke_unlikely`

Delta ist wahrscheinlich unnötig, wenn mindestens eine dieser Lagen dominiert:

- Proposal-Grenzen sind bereits offen, hart und explizit formuliert
- User-Gates, No-Runtime- und No-Mutation-Grenzen sind bereits klar und ausreichend sichtbar
- zusätzliche Pass- oder Challenge-Arbeit würde den praktischen bounded Entscheid kaum verändern
- Delta würde nur Regeln wiederholen, die auf der Oberfläche schon diszipliniert lesbar sind

### `invoke_ambiguous`

Delta bleibt bewusst optional oder unklar, wenn die Evidenz weder klar für Overhead noch klar für Mehrwert spricht, insbesondere wenn:

- mehrere plausible Perspektivverträge konkurrieren
- Challenge nützlich ist, aber die praktische bounded Entscheidung nicht klar kippt
- ein Risiko-Signal existiert, aber kein belastbarer Materialfehler dominiert
- Delta einzelne Caveats besser sichtbar macht, ohne die Gesamtentscheidung klar zu übernehmen

## Harte Anti-Drift-Regeln

- `invoke_likely` ist keine Default-Einschaltung
- `invoke_unlikely` ist kein Verbot weiterer Evidenzarbeit in späteren Batches
- `invoke_ambiguous` ist keine stille Freigabe für automatische Eskalation
- keine Zone autorisiert Integration in Studio
- keine Zone autorisiert Runtime-, Registry-, Truth- oder Operator-Folgen
- diese Charter beschreibt nur Erwägungszonen, keine Policy-Engine
- spätere Evidenz darf diese Charter verfeinern, aber nicht rückwirkend in eine automatische Trigger-Logik umdeuten

## Decision Matrix Read Rule

Die Matrix unter `examples/studio/frame-delta/decision-charter/decision-matrix.json` ist eine kleine explizite Heuristik.
Sie ist keine Score-Tabelle, keine Freigabemaschine und keine verborgene Policy.

## Evidence Mapping Read Rule

Das Evidence Mapping unter `examples/studio/frame-delta/decision-charter/evidence-map.json` bindet jede Charter-Aussage nur an öffentlich vorhandene Batch-1- und Batch-2-Evidenz zurück.
Wenn derselbe Fall in mehr als einer Zone auftaucht, dann nur aspektbezogen: derselbe Fall darf unterschiedliche Teilfragen stützen, aber nicht still gleichzeitig als pauschal `likely` und pauschal `unlikely` gelten.
Wo die Evidenz nicht reicht, bleibt die Zone ausdrücklich offen.

## Negative Claims / Non-Proofs

Batch 1 und Batch 2 beweisen ausdrücklich nicht:

- Integrationsreife von Delta
- einen Studio-Default-Layer
- eine automatische Trigger-Policy
- den Ersatz der Baseline
- eine Legitimation für Runtime-, Registry- oder Studio-Mutation
- eine implizite Bridge von Shadow-Evidenz in Autoritätsflächen

## Closure

Die Charter beantwortet nur die enge Frage, wann Delta überhaupt in Betracht gezogen werden sollte und wann eher nicht.
Sie beantwortet nicht die spätere Integrationsfrage.
