# AICOS Scoring Deescalation and Misreading Stress Report

## Status und Boundary

Dieser Block bleibt proposal-only, bounded und anti-drift.
Er baut auf dem öffentlichen Scoring-Referenzanker `56b48e0` auf.
`56b48e0` ist dabei Referenzanker dieser Scoring-Linie, nicht automatisch eine neue globale Repo-Grundlage.
SMT bleibt Freeze / not-now.
S2 bleibt ungebaut.

Dieser kleine Folgeblock baut keinen neuen Interpretation Pack.
Er schließt nur eine enge Restlücke: wie scheinbar auffällige Scoring-Fälle lesbar bleiben, wenn sie trotz Signalstärke keine materielle Eskalation tragen und keine tragfähige S2-Entry-Nähe haben.

## Warum dieser kleine Folgeblock noch nötig ist

Die bestehende Scoring-Linie liest bereits:
- Kompression und Ausreißer
- Soft-Flag-Zonen
- proposal-level confidence inflation
- kleine Boundary-Fälle zwischen overvaluation, justified exception und borderline

Was noch fehlte, war eine kleine explizite Gegenlese für Fehllektüren:
- starke Rhetorik ohne neue materielle Eskalation
- lokale Stärke ohne registry-weite Ausnahmestärke
- scheinbare S2-Nähe ohne echte Entry-Relevanz
- formale oder kompakte Strenge ohne neuen Review-Druck

Genau diese Restlücke adressiert der Block.

## Welche Fehllektüren getestet werden

Der Stress-Schnitt testet genau vier Fälle:
- ein symbolisches Maximum, das wie materielle Eskalation fehlgelesen werden kann
- eine lokal sehr starke Lösung, die zu schnell wie registry-weite Ausnahme gelesen werden kann
- eine schema- oder modellnahe Proposal-Idee, die zu schnell wie S2-Vorzeichen gelesen werden kann
- eine kompakte Gate-Heuristik, die durch formale Strenge mehr Materialität suggerieren kann als tatsächlich vorliegt

Alle vier Fälle enden absichtlich bei `no_material_escalation`.
Das bedeutet hier nur: der Fall bleibt interpretativ lesbar, ohne dass daraus ein neuer Review-, Policy- oder S2-Druck abgeleitet werden muss.

## Warum `no_material_escalation` keine neue Systemklasse ist

`no_material_escalation` ist in diesem Block nur eine interpretive Lesart.
Es ist keine neue Registry-Klasse.
Es ist kein neuer Status.
Es ist kein Runtime-Signal.
Es ist keine Policy- oder Threshold-Entscheidung.
Es ist nur die explizite maschinenlesbare Form einer menschlichen Deeskalationslese: auffällige Oberfläche allein reicht nicht für neuen materiellen Eskalationsdruck.

## Warum der Block komplementär statt doppelt bleibt

Dieser Block ist nicht doppelt zu `AICOS_SCORING_AUDIT_INTERPRETATION.md`, weil dort die Makro-Lesart von Seed-Kultur, Kompression und künftigen Achsen im Vordergrund steht, nicht ein kleiner fallnaher Deeskalations-Stressschnitt.

Dieser Block ist nicht doppelt zu `AICOS_SCORING_SOFT_FLAG_REVIEW.md`, weil dort primär bestehende Soft-Flags triagiert werden. Hier geht es enger darum, warum auffällige Fälle gerade nicht weiter eskaliert werden sollten.

Dieser Block ist nicht doppelt zu `AICOS_SCORING_PROPOSED_HIGH_CONFIDENCE_REVIEW.md`, weil dort nur ein enger Proposal-Cluster gelesen wird. Hier werden verschiedene Fehllektüre-Typen gemeinsam als Deeskalations-Stressfälle geprüft.

Dieser Block ist nicht doppelt zu `examples/scoring/soft-flag-boundary-cases/`, weil der bestehende Boundary-Korpus nur die drei vorhandenen Review-Lesarten `likely_overvaluation`, `justified_exception` und `borderline_but_defensible` schärft. Der neue Stress-Schnitt prüft stattdessen Fälle, die trotz auffälliger Oberfläche gerade keinen zusätzlichen materiellen Eskalationsschritt tragen.

## Was an den Fällen robust lesbar bleibt

Robust lesbar bleibt:
- symbolische oder rhetorische Stärke ist nicht automatisch materielle Eskalation
- lokale operative Stärke ist nicht automatisch registry-weite Ausnahme
- modell- oder schema-nahe Sprache ist nicht automatisch echte S2-Entry-Nähe
- formale Kompaktheit oder Gate-Struktur ist nicht automatisch Belegstärke

Gerade diese Gegenlese senkt Drift-Risiko, weil nicht jede auffällige Oberfläche sofort als Modelllücke oder Scoring-Druck fehlgelesen wird.

## Was der Block NICHT tut

Dieser Block tut ausdrücklich nicht:
- kein S2-Build
- keine neue Scoring-Ontologie
- keine neue Review- oder Statusklasse
- keine neue Policy- oder Threshold-Mechanik
- keine Registry-, Alias- oder Index-Mutation
- keine Runtime-, Provider-, Operator- oder MEC-Anbindung
- keine Wiederholung des bestehenden Soft-Flag-Boundary-Korpus
- keine verdeckte Rescore-Empfehlung

## Fazit

Die bestehende Scoring-Linie konnte bereits erklären, wann Soft-Flag-Druck steigt.
Dieser kleine Folgeblock erklärt die komplementäre Restfrage: wann auffällige Fälle trotz Signalstärke nicht weiter eskalieren sollten.

Genau deshalb bleibt der Schnitt klein, fallnah und anti-drift.
