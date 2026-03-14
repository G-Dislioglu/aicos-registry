# Frame Delta SMT Pilot Entry Criteria

## Status und Boundary

Diese Note ist proposal-only, bounded und anti-drift.
Sie stützt sich auf die öffentlich verifizierten Referenzpunkte `59391de`, `fd9cecf`, `0c50c84`, `8cf6ba5` und `388094a`.

Die SMT Candidate Note ist damit öffentlich dokumentiert, aber daraus folgt ausdrücklich noch kein Pilot.
Diese Note ist keine Freigabe, kein Operator, kein Build, keine Integration, keine Provider-Bindung und keine stille Vorentscheidung zugunsten einer Pilotierung.

## Zweck der Note

Diese Note beantwortet nur eine engere Frage:
Unter welchen Mindestbedingungen dürfte AICOS einen kleinen, begrenzten SMT-Pilot überhaupt in Betracht ziehen?

Sie beantwortet ausdrücklich nicht die Frage, ob ein solcher Pilot jetzt gebaut werden sollte.

## Warum nach der Candidate Note noch KEIN Pilot automatisch folgt

Die Candidate Note hält nur fest, dass es ein potenziell brauchbares Pattern gibt.
Sie beweist weder Architektur-Reife noch einen belastbaren Mehrwert gegenüber der bestehenden Challenge-/Frame-Delta-Linie.

Ein Pilot darf daher nicht schon deshalb starten, weil:

- die Idee interessant klingt
- eine hübsche Spec geschrieben werden kann
- mehrere Einbaupositionen denkbar wären
- unterschiedliche Modelle unterschiedliche Denkstile haben
- Split/Merge theoretisch attraktiv wirkt

## Mindestbedingungen für einen späteren Pilot

Ein Pilot wäre allenfalls erwägenswert, wenn mindestens diese Bedingungen sauber benennbar und prüfbar sind:

- ein klarer einzelner Pilot-Slot statt breiter Architektur
- ein klarer Vergleichsmaßstab gegen die bestehende Challenge-/Frame-Delta-Linie
- ein klar erwartbarer Mehrwert, der über bloße Dramatisierung hinausgeht
- klar definierte Failure-Signale
- ein klarer Abbruchpunkt
- kein Bedarf an stiller Mutation bestehender Kernlinien
- realistische, nicht heroisch überhöhte Output-Formen

## Bewertungszustände

### `entry_criteria_met`

Darf nur gesetzt werden, wenn:

- genau ein begrenzter Pilot-Slot benannt ist
- ein Vergleich gegen die bestehende Linie ausdrücklich definiert ist
- Failure-Signale und Abort-Regeln vorab benannt sind
- `no_material_gain` als valides Ergebnis zugelassen ist
- kein Operator, kein Build und keine Integration vorausgesetzt werden

### `entry_criteria_not_met`

Muss gelten, wenn mindestens eines davon zutrifft:

- der Slot ist unklar oder zu breit
- es gibt keinen klaren Gegenvergleich
- der behauptete Mehrwert bleibt vage
- Failure-Signale fehlen oder sind dekorativ
- ein Pilot würde implizit bestehende Kernlinien mutieren
- der Output-Rahmen ist auf heroische Erfolgserzählung verengt

### `needs_more_evidence`

Muss gelten, wenn:

- ein potenzieller Mehrwert denkbar ist, aber noch nicht hinreichend operationalisiert wurde
- der Vergleichsmaßstab zwar skizzierbar ist, aber noch nicht scharf genug ist
- Failure-Signale benannt sind, aber der Abbruchpunkt noch nicht belastbar genug ist

## Harte No-Go-Bedingungen

Ein Pilot ist ausdrücklich No-Go, wenn:

- er ohne klaren Gegenvergleich zur bestehenden Linie starten soll
- er nur mit stiller Integrationslogik sinnvoll erscheint
- er einen Operator oder Build voraussetzt
- er gleichzeitig mehrere Pilot-Slots öffnet
- er P1 und P3 parallel oder quasi-parallel anlegt
- er schon als Vorstufe zu `O8` gelesen werden müsste oder faktisch `O8` jetzt vorbereiten würde
- er Provider- oder Modellrollen festschreiben würde
- er nur mit überhöhten Pflicht-Outputs plausibel wirkt

## Abort- und Abbruch-Regeln

Ein späterer Pilot müsste sofort abbrechbar sein, wenn:

- künstliche Gegenrahmung ohne materiellen Mehrwert dominiert
- `false_split` häufig auftritt
- `shallow_split` häufig auftritt
- ein diplomatischer Merge echte Spannung verdeckt
- keine klare Output-Differenz zur normalen Challenge-/Frame-Delta-Linie sichtbar wird
- die Komplexität im Verhältnis zum Erkenntnisgewinn unverhältnismäßig wird
- die Erfolgskriterien unklar oder beweglich bleiben
- Drift in Richtung stiller Integrationslogik einsetzt

## Realistische mögliche Pilot-Outputs

Ein späterer Pilot dürfte nur mit nüchternem Output-Rahmen geprüft werden:

- `new_question`
- `boundary_clarification`
- `evidence_gap`
- `trigger_refinement`
- `no_material_gain`

`no_material_gain` muss ausdrücklich als valides Ergebnis gelten.
Ohne diese Möglichkeit würde ein Pilot zum Selbstbestätigungsritual werden.

## Candidate First Pilot Slot Recommendation

Falls später überhaupt ein Pilot erwogen wird, dann höchstens:

- erster und einziger bevorzugter Anfangs-Slot: `P1 Frame Challenge`
- nur als spätere zweite Kandidatur, nicht parallel: `P3 Improvement Gate`

Ausdrücklich nicht:

- kein Pilot jetzt
- kein Build jetzt
- kein Operator jetzt
- keine 4-Positionen-Architektur jetzt
- nicht beide Slots gleichzeitig

## Was ausdrücklich NICHT behauptet wird

Diese Note behauptet nicht:

- dass ein Pilot bereits beschlossen ist
- dass SMT bereits architekturreif ist
- dass P1 und P3 beide bald gebaut werden
- dass bereits ein `O8`-Kanon vorbereitet wird
- dass Provider- oder Modellrollen jetzt festgelegt werden sollten
- dass ein Pilot ohne klaren Gegenvergleich sinnvoll wäre

## Harte Anti-Drift-Regeln

- diese Note ist nur eine Entry-Criteria-Note
- diese Note gibt keinen Pilot frei
- diese Note baut keinen Operator
- diese Note integriert nichts in Delta, Studio, Runtime oder Registry
- diese Note erzeugt keine Trigger-Policy und keine Escalation-Policy
- diese Note erlaubt nur spätere Pilot-Erwägung bei engem, prüfbarem Scope
- diese Note erlaubt ausdrücklich auch `no_material_gain` als valides Ende

## Closure

Nach `388094a` ist SMT als Kandidatenmaterial öffentlich dokumentiert.
Ob daraus je ein Pilot folgt, bleibt offen.
Ein späterer Pilot wäre nur unter engen, prüfbaren und hart abbrechbaren Bedingungen überhaupt erwägenswert.
