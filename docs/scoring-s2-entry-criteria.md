# Scoring S2 Entry Criteria

## Status und Boundary

Diese Notiz ist proposal-only, bounded und anti-drift.
Sie baut auf dem öffentlich verifizierten Stand bis `9f95871` auf.
Die früheren öffentlichen Referenzpunkte `59391de`, `fd9cecf`, `0c50c84`, `8cf6ba5`, `388094a`, `5b7ecbb` und `6a33235` bleiben unverändert.

S1 bleibt der aktuelle stabile Stand.
SMT bleibt Freeze / not-now.
Diese Notiz baut kein S2.
Sie legt nur fest, unter welchen engen Bedingungen ein späteres S2 überhaupt erwogen werden dürfte.

## Warum aus S1 nicht automatisch S2 folgt

S1 ist als Registry-Layer-Scoring-Linie ausdrücklich geschlossen worden.
Es existieren bereits:

- die bestehende `impact`-Triade
- die generierte `score_summary`-Projektion
- Hygiene- und Audit-Checks
- Soft-Flag-Review als menschliche Interpretationsschicht

Das bedeutet gerade nicht, dass die nächste sinnvolle Bewegung automatisch ein Ausbau zu S2 wäre.
Eine stabile S1-Linie beweist nur, dass der aktuelle Rahmen tragfähig ist.
Sie beweist nicht, dass zusätzliche Achsen, schärfere Semantik oder neue Review-Schichten schon reif sind.

## Mindestbedingungen, bevor S2 überhaupt erwogen werden darf

Ein späteres S2 dürfte nur erwogen werden, wenn alle folgenden Bedingungen gleichzeitig erfüllt sind:

### 1. Es gibt eine echte Interpretationslücke, nicht nur Unbehagen an Ausnahmen

S2 darf nicht gebaut werden, nur weil einzelne Soft-Flags unangenehm wirken oder weil symbolische Ausnahmen existieren.
Es braucht eine klar benannte Lücke, die mit S1 plus menschlicher Review nicht sauber abgedeckt werden kann.

### 2. Die Soft-Flag-/Review-Grenzen sind klein, lesbar und wiederholbar

Bevor S2 gedacht wird, muss die bestehende Soft-Flag-Interpretation auf kleinen Boundary-Fällen stabil lesbar sein:

- wann `likely_overvaluation` plausibel ist
- wann `justified_exception` plausibel ist
- wann nur `borderline_but_defensible` bleibt

Wenn diese menschliche Trennlinie schon nicht sauber lesbar ist, würde S2 die Unklarheit nur mit mehr Struktur überdecken.

`borderline_but_defensible` ist dabei nur als enge Ausnahmezone zulässig.
Das Label darf nur verwendet werden, wenn gleichzeitig mindestens ein reales Overvaluation-Signal und mindestens ein reales Defensibility- oder Exception-Signal vorliegen.
Es ist nicht zulässig als Default-Auffangkategorie für unklare Fälle.
Es ist nicht zulässig bei bloßer Unsicherheit oder fehlender Lesbarkeit.
Es ist nicht zulässig, wenn die Falllage bei enger Lektüre bereits klar `likely_overvaluation` oder klar `justified_exception` trägt.

### 3. Jede mögliche neue S2-Achse hat explizite Semantik vor jeder Datenarbeit

Bevor irgendein S2-Feld oder S2-Profil erwogen wird, müssten mögliche additive Achsen wie etwa `evidence_strength`, `learning_value`, `salvage_potential` oder `drift_risk` einzeln semantisch beschrieben werden.

Pflicht wäre dabei:

- klare Bedeutung
- klare Nicht-Bedeutung
- klare Abgrenzung zur bestehenden `impact`-Triade
- klare Abgrenzung zu Policy, Ranking und Promotion

### 4. Es gibt keine stille Backfill- oder Mutationslogik

S2 dürfte niemals mit der stillen Erwartung starten, später die ganze Registry automatisch umzuschreiben.
Vorbedingung wäre eine explizite, kleine, menschlich prüfbare Einführungsstrategie ohne implizite Massenmutation.

### 5. S2 bleibt strikt von Runtime, MEC und Operator-Entscheidung getrennt

Ein späteres S2 dürfte keine Brücke bauen zu:

- Runtime-Scoring
- MEC-/Operator-Flächen
- Promotion- oder Export-Entscheidungen
- automatischer Prioritätspolitik

Wenn S2 als indirekte Policy-Schicht gedacht wird, ist die Eintrittsbedingung bereits verfehlt.

### 6. Der Nutzen von S2 ist enger als seine Drift-Gefahr

S2 wäre nur dann vertretbar, wenn der konkrete Nutzen klar kleiner, enger und prüfbarer beschrieben werden kann als die neu entstehende Drift-Fläche.
Mehr Felder sind kein Nutzen an sich.
Mehr Differenzierung ist kein Nutzen an sich.

## No-Go-Bedingungen, die S2 aktuell blockieren

S2 bleibt blockiert, solange eine oder mehrere der folgenden Bedingungen zutreffen:

- die Soft-Flag-Grenzen werden noch primär narrativ statt wiederholbar gelesen
- `borderline_but_defensible` fungiert noch als Rest- oder Auffangkategorie statt als enge Ausnahmezone mit doppelseitigem Druck
- zusätzliche Achsen existieren nur als Wunschliste, nicht als Semantik
- S2 würde faktisch als neue Schwellenwert- oder Policy-Maschine benutzt
- S2 würde verwendet, um bestehende symbolische Ausnahmen umzudeuten statt sauber zu separieren
- S2 würde still neue Pflichtfelder oder Backfill-Druck in die Registry tragen
- S2 würde als Abkürzung für Ranking, Promotion oder Priorisierung missbraucht

## Warum S2 jetzt noch nicht gebaut wird

S2 wird jetzt nicht gebaut, weil der aktuell richtige nächste Schritt enger ist:
Nicht mehr Modell, sondern bessere Grenzlesbarkeit.

Der jetzige Block prüft deshalb zuerst:

- ob die S2-Eintrittsfrage überhaupt hart genug formulierbar ist
- ob die bestehende Soft-Flag-/Review-Klassifikation an wenigen Boundary-Fällen bereits stabil genug lesbar ist

Wenn diese Vorfrage nicht sauber beantwortet ist, wäre ein S2-Bau nur Scope-Ausweitung.

## Anti-Drift-Regeln

Für diesen Block gelten ausdrücklich:

- kein S2-Build jetzt
- keine automatische Schwellenwert-Mechanik
- keine neue Policy
- keine stille Mutation der bestehenden Scoring-Linie
- keine Runtime-/MEC-/Operator-Anbindung
- keine Registry-/Alias-/Index-Mutation
- keine SMT-Rückkehr

## Was diese Notiz bewusst nicht tut

Diese Notiz:

- definiert kein neues S2-Schema
- autorisiert keine neuen Pflichtfelder
- autorisiert keine Backfill-Kampagne
- setzt keine neue Review-Automatik
- ersetzt keine menschliche Soft-Flag-Interpretation

## Fazit

S1 bleibt der belastbare Arbeitsstand.
Ein späteres S2 ist nur dann denkbar, wenn zuerst die bestehende Soft-Flag-Interpretation und ihre Grenzfälle klein, lesbar und wiederholbar bleiben.
Bis dahin ist die richtige Bewegung nicht Ausbau, sondern Begrenzung.
