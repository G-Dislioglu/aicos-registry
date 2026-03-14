# Frame Delta SMT Candidate Note

## Status und Boundary

Diese Note ist eine proposal-only, bounded, anti-drift Candidate Note.
Sie stützt sich auf die öffentlich verifizierten Referenzpunkte `59391de`, `fd9cecf`, `0c50c84` und `8cf6ba5` sowie auf eine externe konzeptuelle SMT-Linie, die hier nur als Kandidatenmaterial gelesen wird.

Diese Note ist nicht:

- ein neuer kanonischer Operator
- eine Integrationsfreigabe
- eine Trigger-Policy
- eine Provider-Bindung
- eine Runtime-, Registry- oder Studio-Mutation

## Kurze Problemstellung

Die externe SMT-Idee versucht, bei harten Framing-Konflikten mehr zu leisten als ein weiches Challenge.
Ihr möglicher Kern ist interessant: getrennte Gegenrahmung, explizite Spannungspunkte, versteckte Annahmen und eine klar benannte Failure Condition können dort nützlich sein, wo eine zu glatte Einheitslesart den Konflikt zu früh beruhigt.

Gleichzeitig ist die Idee in ihrer rohen Form überzogen.
Sie ist noch kein belastbarer Architekturblock für AICOS.

## Was am Pattern wertvoll ist

Folgende Kerne sind für AICOS konzeptuell brauchbar:

- bewusste getrennte Gegenrahmung statt kontaminierter Gegenposition
- kein mittender Merge, der Widerspruch zu früh weichzeichnet
- eine explizite `agreement_zone`
- explizite `tension_points`
- eine benennbare `hidden_assumption` unter dem sichtbaren Widerspruch
- eine benennbare `failure_condition` als Achillesferse
- `false_split` und `shallow_split` als Lernsignal, wenn der Split künstlich oder oberflächlich bleibt

Der Wert dieser Kerne liegt nicht in Größe oder Dramatik.
Er liegt darin, dass sie mögliche Fehlformen eines zu glatten Challenge-Durchlaufs sichtbarer machen könnten.

## Was daran riskant, überzogen oder zu früh ist

Die externe Linie wird problematisch, sobald sie mehr behauptet als derzeit getragen ist.
Besonders riskant sind:

- die implizite Behauptung, daraus müsse jetzt ein neuer Hauptoperator `O8` werden
- die implizite Behauptung, Split, Merge und Transcend seien schon ein reifer Architekturpfad
- die Überhöhung eines möglichen Outputs zu einer Pflichtform wie `transcendent_question`
- die Vermischung von interessanter Denkfigur und echter Produkt-/Runtime-Architektur
- provider- oder modellgebundene Rollenzuweisungen als verfrühte Festlegung
- feste Kosten- oder Performance-Aussagen ohne belastbare AICOS-Evidenz

## Welche Teile AICOS übernehmen könnte

AICOS könnte jetzt höchstens als Note übernehmen:

- den Gedanken der getrennten Gegenrahmung als bewusste Gegenlesart
- den Gedanken eines nicht-mittelnden Merge, der echte Spannung nicht versteckt
- `agreement_zone`, `tension_points`, `hidden_assumption` und `failure_condition` als mögliche spätere Analysefelder
- `false_split` und `shallow_split` als nützliche Negativsignale
- einen nüchternen Blick darauf, dass aus einer Kollision mehrere wertvolle Outputs entstehen können, nicht nur ein heroischer Endsatz

## Welche Teile ausdrücklich NICHT übernommen werden

Ausdrücklich nicht übernommen werden jetzt:

- kein neuer kanonischer Hauptoperator `O8`
- eine sofortige Architekturintegration
- vier feste Einbaupositionen
- keine Provider-Bindung und keine provider-spezifische Rollenzuweisung
- feste Kostenaussagen als Architektur-Fakt
- eine Pflicht, immer eine `transcendent_question` zu erzeugen
- metaphysische oder künstlich grandiose Aufladung
- eine stille Mutation der bestehenden Frame-Delta-Linie

## Realistischere mögliche Output-Typen

Falls es später überhaupt einen kleinen Split/Merge-Pilot geben sollte, dann sind mehrere nüchterne Outputs realistischer als ein einziges Pflicht-Transzendenzformat:

- `new_question`
- `boundary_clarification`
- `evidence_gap`
- `trigger_refinement`
- `no_material_gain`

Gerade `no_material_gain` ist wichtig.
Ein späterer Pilot wäre nur seriös, wenn er auch explizit festhalten darf, dass der Aufwand in einem Fall keinen materiellen Erkenntnisgewinn gebracht hat.

## Adoption Boundaries

### `adopt_now_as_note`

Jetzt als Note tragbar sind:

- getrennte Gegenrahmung
- nicht-mittelnder Merge
- `agreement_zone`
- `tension_points`
- `hidden_assumption`
- `failure_condition`
- `false_split`
- `shallow_split`

### `defer_for_later_pilot`

Allenfalls später, und nur als schmaler Pilot, denkbar sind:

- eine probeweise Einbettung in `P1 Frame Challenge`
- alternativ eine engere Prüfung in `P3 Improvement Gate`
- eine kleine Auswertung, welche Output-Typen tatsächlich materiellen Mehrwert liefern

### `do_not_claim`

Jetzt ausdrücklich nicht behaupten:

- dass SMT bereits ein AICOS-Architekturblock ist
- dass daraus ein neuer Standardoperator folgt
- dass ein Merge immer in einen besonderen Erkenntnis-Output kippt
- dass Provider-Rollen bereits festgelegt werden sollten
- dass die Idee schon integrationsreif ist

### `out_of_scope_now`

Jetzt außerhalb des Scopes bleiben:

- echter Operatorbau
- Runtime-/Registry-/Studio-Integration
- Provider-Design
- Policy- oder Trigger-Automatik
- Ausbau zu einer Vier-Positionen-Architektur

## Pilot Position Recommendation

Wenn es später überhaupt einen Pilot geben sollte, dann bevorzugt:

- primär `P1 Frame Challenge`
- alternativ `P3 Improvement Gate`

Aber auch das ist noch keine Umsetzungsfreigabe.
Diese Note empfiehlt weder einen sofortigen Pilot noch einen Build noch einen Operator.

## Harte Anti-Drift-Regeln

- diese Note kanonisiert keinen neuen Operator
- diese Note integriert nichts in Studio oder Delta
- diese Note erzeugt keine automatische Trigger-Policy
- diese Note bindet keine Provider-Rollen
- diese Note erklärt `transcendent_question` nicht zu einem Pflichtoutput
- diese Note erlaubt ausdrücklich auch den Output `no_material_gain`
- spätere Arbeit darf diese Note höchstens in einen kleinen Pilot übersetzen, nicht direkt in Hauptarchitektur

## Closure

Der brauchbare Kern der SMT-Idee liegt in einer disziplinierteren Behandlung von Gegenrahmung, Spannung und Failure Conditions.
Was darüber hinausgeht, bleibt vorerst bewusst Kandidatenmaterial und nicht mehr.
