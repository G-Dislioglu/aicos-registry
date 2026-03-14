# AICOS Mainline Re-Prioritization after SMT Freeze

## Status und Boundary

Diese Note ist proposal-only, bounded und anti-drift.
Sie stützt sich auf die öffentlich verifizierten Referenzpunkte `59391de`, `fd9cecf`, `0c50c84`, `8cf6ba5`, `388094a` und `5b7ecbb`.

Die SMT-Linie ist damit vorerst ausreichend dokumentiert.
Sie bleibt für den Moment eingefroren:

- kein weiterer SMT-Block jetzt
- kein Pilot jetzt
- kein O8 jetzt
- keine Integration jetzt
- keine Provider-Bindung jetzt

## Zweck der Note

Diese Note beantwortet nur eine engere Hauptlinien-Frage:
Welcher nächste zusammenhängende K2-Block bringt AICOS jetzt den höchsten Nutzwert bei vertretbarem Risiko?

Sie beantwortet ausdrücklich nicht die Frage, welche weiteren Theoriepfade irgendwann interessant wirken könnten.

## Warum jetzt nicht weiter SMT

Die SMT-Linie hat ihren aktuellen bounded Zweck erfüllt:

- Candidate Pattern ist dokumentiert
- Pilot Entry Criteria sind dokumentiert
- die Freeze-Grenze ist explizit gesetzt

Ein weiterer SMT-Schritt würde jetzt vor allem Theorie-, Pilot- oder Integrationsdruck erzeugen.
Das wäre im Verhältnis zum aktuellen Hauptlinien-Nutzwert der falsche nächste Schritt.

## Geprüfte Hauptlinien-Kandidaten

Für die Re-Priorisierung wurden genau vier repo-nahe Hauptlinien-Kandidaten betrachtet:

- `K2 — Studio Next Review Target Boundary Cases`
- `K2 — Studio Review Posture Boundary Corpus`
- `K2 — Studio Dossier Readout Stress Cases`
- `K2 — Scoring S2 Entry Criteria Note`

Alle vier sind realistisch genug, aber nicht gleichwertig.

## Empfohlener nächster K2-Block

Empfohlen wird genau ein nächster Block:

- `K2 — Studio Next Review Target Boundary Cases`

## Warum genau dieser Block jetzt Vorrang hat

Dieser Block hat den höchsten aktuellen Nutzwert, weil er eine echte Hauptlinien-Lücke schließt, die bereits im vorhandenen öffentlichen Studio-Stand sichtbar ist:

- `next_review_target` ist bereits ein zentrales Feld in Paket-, Routing-, Review- und Pipeline-Linie
- die zulässigen Ziele sind bereits eng begrenzt: `none`, `manual_design_followup`, `request_human_decision`, `human_registry_review`
- die Mapping- und Routing-Dokumente geben die Regeln bereits vor, aber die praktischen Grenzfälle zwischen diesen Zielen sind noch nicht als eigener kleiner Entscheidungsblock verdichtet
- genau dort entsteht sonst unnötige Interpretationsfreiheit: wann bleibt etwas bei `manual_design_followup`, wann ist `request_human_decision` gerechtfertigt, wann ist `human_registry_review` wirklich tragfähig

Der Block wäre zugleich eng genug:

- keine neue Ontologie
- keine neue Runtime- oder Registry-Fläche
- keine neue SMT-Arbeit
- keine neue Scoring-Semantik
- keine versteckte Integrationslogik

## Warum die anderen jetzt nicht zuerst dran sind

### `K2 — Studio Review Posture Boundary Corpus`

Dieser Kandidat ist sinnvoll, aber noch nicht der beste erste Schritt.
`forward`, `hold`, `split`, `downgrade`, `archive` und `discard` hängen praktisch an sauberer Zielklarheit.
Wenn die Zielgrenzen noch nicht als eigener kleiner Boundary-Block geschärft sind, bleibt auch die Posture-Kalibrierung unnötig weich.

### `K2 — Studio Dossier Readout Stress Cases`

Dieser Kandidat hat Nutzwert, aber eher als zweiter Schritt.
Dossier- und Summary-Linie sind bereits lesbar und verifiziert.
Zusätzliche Stressfälle würden vor allem die menschliche Lesefläche robuster machen, aber noch nicht die prioritäre Entscheidungsgrenze im Hauptfluss klären.

### `K2 — Scoring S2 Entry Criteria Note`

Dieser Kandidat ist bewusst nicht zuerst dran.
`AICOS_SCORING_S1_CLOSURE.md` hält explizit fest, dass S1 workflow-ready ist und S2 noch nicht gestartet wurde.
Ein früher S2-Block hätte aktuell höhere Theorieausbau-Gefahr als unmittelbaren Hauptlinien-Hebel.

## Was ausdrücklich NICHT als nächster Schritt empfohlen wird

Nicht als nächster Schritt empfohlen werden jetzt:

- SMT-Fortsetzung
- SMT-Pilotbau
- O8-/Operatorbau
- SMT-Integration in Studio oder Delta
- weitere Theorie- oder Schema-Ausweitung ohne klaren Hebel
- frühe Studio-/Scoring-Rückschleifen ohne unmittelbare Hauptlinien-Lücke

## Deferred / Not-Now

Not-now bleibt ausdrücklich:

- SMT-Fortsetzung: nicht jetzt
- Pilotbau: nicht jetzt
- O8-/Operatorbau: nicht jetzt
- weitere Theorieausweitung ohne klaren Nutzwert: nicht jetzt
- frühe Studio-/Scoring-Rückschleifen: nicht jetzt

## Harte Anti-Drift-Regeln

- diese Note empfiehlt genau einen nächsten K2-Block
- diese Note behandelt SMT als vorerst eingefroren
- diese Note öffnet keinen Pilot und keinen Operatorpfad
- diese Note baut nichts und integriert nichts
- diese Note erklärt nicht alle Kandidaten künstlich für gleichwertig
- diese Note priorisiert Nutzwert und Anschlussfähigkeit vor Theorie-Attraktivität

## Closure

Nach dem SMT-Freeze ist die sinnvollste Hauptlinien-Arbeit nicht weitere Konzeptvertiefung, sondern eine kleine harte Boundary-Schärfung im bestehenden Studio-Kernfluss.
Der nächste K2-Block sollte daher die Zielgrenzen von `next_review_target` praktisch und bounded kalibrieren.
