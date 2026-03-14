# AICOS Studio Review Posture and Dossier Stress Report

## Status und Boundary

Dieser Block bleibt proposal-only, bounded und anti-drift.
Er baut auf dem öffentlich verifizierten Stand bis `6a33235` auf.
Die früheren öffentlichen Referenzpunkte `59391de`, `fd9cecf`, `0c50c84`, `8cf6ba5`, `388094a` und `5b7ecbb` bleiben dabei unverändert.
SMT bleibt weiter Freeze / not-now.

Der jetzt schon öffentlich gesicherte Block `Studio Next Review Target Boundary Cases` hat die Zielklassen `manual_design_followup`, `request_human_decision` und `human_registry_review` praktisch geschärft.
Genau diese geschärfte Zielklarheit ist die Vorbedingung für den jetzigen größeren Studio-Folgeblock: Erst wenn die Zielgrenzen lesbar sind, lässt sich die vorgelagerte Review-Posture-Entscheidung und die nachgelagerte Dossier-Lesefläche sauber härten.

## Warum diese Kombination als gemeinsamer Block sinnvoll ist

Review-Posture und Dossier-Readout sind hier absichtlich nicht getrennt.
Die Posture entscheidet, wie ein Mensch einen Fall weiter liest.
Das Dossier entscheidet, wie klar oder driftanfällig diese Lesefläche danach bleibt.

Wenn nur Posture-Grenzen geschärft würden, bliebe unklar, ob die spätere Dossier-/Summary-Fläche diese Entscheidung sauber transportiert.
Wenn nur Dossier-Stressfälle gebaut würden, bliebe unklar, ob die vorgelagerte Posture-Wahl selbst sauber getrennt ist.

Darum bündelt dieser Block beides:
- die Grenze zwischen bestehenden Review-Postures
- die Robustheit der bestehenden Dossier-/Summary-Lesefläche

## Welche Posture-Grenzen wurden getestet

Getestet wurden ausschließlich bestehende Postures aus der Review Procedure:
- `forward`
- `hold`
- `split`
- `downgrade`
- `archive`
- `discard`

Der Korpus ist absichtlich klein und scharf:
- 2 klare Fälle für `forward` oder `hold`
- 2 klare Fälle für `split` oder `downgrade`
- 2 klare Fälle für `archive` oder `discard`
- 2 echte Ambiguitätsfälle, in denen zwei Postures plausibel wirken

Die zentrale Grenzlogik lautet:
- `forward` nur bei bounded, legibler, gate-disziplinierter Weitergabe
- `hold` wenn Form okay, Reife aber noch nicht ausreichend ist
- `split` wenn zwei verschiedene Spannungen oder Zielrichtungen nicht gemeinsam getragen werden sollten
- `downgrade` wenn nicht Vermischung, sondern Überstärke das Problem ist
- `archive` wenn bounded Retention noch sinnvoll ist, aber kein aktiver Vorwärtsdruck mehr
- `discard` wenn Drift oder Irreführung konserviert würde

## Welche Leseflächen-Stresssignale wurden getestet

Der Dossier-Teil testet keine neue Theorie und keine UI.
Er testet nur wenige harte Readout-Schwächen der bestehenden Lesefläche:
- zu glatte Zusammenfassung trotz offener Konflikte
- versteckte Grenzverwischung zwischen bounded Handoff und impliziter Zustimmung
- schlechte Prioritätensicht bei ernst klingenden, aber lokal gebremsten Fällen
- unklare Trennung zwischen sicherem Kern und offener Unsicherheit

Die Stressfälle bleiben gültige `studio_dossier`-Artefakte.
Sie sollen nicht kaputt sein.
Sie sollen zeigen, wo selbst gültige, bounded Dossiers von Menschen falsch überlesen werden könnten.

## Was robust ist

Robust ist die bestehende Logik dort, wo sie bereits explizite Trennlinien besitzt:
- die Review Procedure hält die sechs Postures klein und lesbar
- die Review-Record-Semantik zwingt Entscheidungstyp, Gate-Hinweis und resulting posture in eine sichtbare Form
- das Dossier erzwingt proposal-only, no truth mutation und no runtime write explizit
- die Summary-Report-Spezifikation erzwingt stabile Abschnitte, sichtbare Open Conflicts und explizite Boundary Flags

Der neue Block zeigt, dass diese vorhandenen Linien bereits stark genug sind, um einen kleinen Boundary- und Stress-Korpus zu tragen, ohne neue Ontologie einzuführen.

## Wo Drift- und Leserisiko bleibt

Drift- und Leserisiko bleibt an vier Stellen:
- gute Form kann immer noch mit echter Reife verwechselt werden
- ein ruhiger Top-Summary kann verbleibende Konflikte psychologisch nach hinten drücken
- `downgrade` und `split` bleiben in gemischten Fällen nah beieinander
- ein sauber formulierter Handoff kann immer noch zu leicht wie implizite Zustimmung gelesen werden

Dieser Block reduziert diese Risiken, beseitigt sie aber nicht.
Er macht die Lesefehler sichtbarer.
Er beweist nicht, dass spätere Menschen sie nie mehr begehen.

## Was der Block NICHT beweist

Dieser Block beweist ausdrücklich nicht:
- keine neue Review-Posture-Klasse
- keine neue `next_review_target`-Klasse
- keine neue Dossier- oder Summary-Theorie
- keine UI-Schicht
- keine Runtime-, Provider-, Operator- oder MEC-Logik
- keine Registry-, Alias- oder Index-Mutation
- keine SMT-Rückkehr
- keine Scoring-S2-Verschiebung
- keine automatische Prioritätspolitik
- keine automatische Weiterleitung

## Fazit

Der Block liefert keine neue Hauptsemantik.
Er schärft nur zwei bestehende menschliche Leseflächen gemeinsam:
- die Entscheidung, welche Review-Posture bei grenznahen Fällen sauber ist
- die Frage, ob ein gültiges Dossier diese Entscheidung später noch lesbar und konflikt-sichtbar hält

Genau deshalb ist dieser Block als gemeinsamer bounded Studio-Human-Review-Block sinnvoll.
