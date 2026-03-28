# Relational Selection Check — Methodenreferenz

## Status

- `truth_class`: `proposal_only`
- zuerst gedacht für `RADAR.md`, Review-Arbeit und Crossings
- nicht Teil der Maya-Runtime, nicht Teil aktiver Produktlogik

## Zweck

Nicht jede erkennbare Beziehung zwischen Ideen, Karten, Kandidaten oder Reviews ist handlungswürdig.

Dieser Check ist eine kleine Zwischendisziplin für Fälle, in denen zwei Quellen oder Kandidaten zusammen stärker wirken könnten, aber unklar ist, ob daraus ein echter Maya-naher Block entsteht oder nur eine schön klingende Pseudo-Synthese.

Er beantwortet nicht:

**"Ist das interessant?"**

sondern:

**"Ist diese Beziehung stark genug, um bounded weitergetragen zu werden?"**

## Einsatzbereich

Sinnvoll vor allem bei:

- nicht-trivialen Crossings in `RADAR.md`
- Kandidaten, die aus mehreren Quellen zusammengezogen werden sollen
- Fällen mit spürbarer Affinität, aber unklarem Hebel
- externen KI-Vorschlägen, die methodisch stark wirken, aber noch keinen sauberen Blockzuschnitt haben

Nicht zuerst gedacht für:

- Maya-Runtime
- UI-/Surface-Änderungen
- Provider-, API- oder Persistenzentscheidungen
- jeden kleinen Einzelkandidaten ohne echte Crossing-Spannung

## Kernidee

Eine Beziehung wird nicht nur über Affinität geprüft.

Sie ist erst dann belastbar, wenn auch sichtbar wird:

- warum sie trägt
- warum sie gerade nicht vorschnell zusammengeführt werden sollte
- ob daraus realer Hebel entsteht
- ob Truth-Mix oder Scheinsynthese droht

## Minimalfragen

Bei einem nicht-trivialen Crossing mindestens diese Fragen beantworten:

1. **Affinität**
   - Was verbindet die beiden Quellen wirklich?
2. **Gegenaffinität**
   - Was spricht gegen ein vorschnelles Zusammenführen?
3. **Hebelgewinn**
   - Was wird durch die Beziehung real klarer, kleiner, testbarer oder Maya-tauglicher?
4. **Truth-Mix-Risiko**
   - Vermischt die Beziehung Ist-Wahrheit, lokalen Stand und proposal-only Material?
5. **Täuschungsrisiko**
   - Wirkt die Beziehung stärker, als sie operativ tatsächlich ist?
6. **Why-not-more**
   - Was beweist diese Beziehung ausdrücklich nicht?

## Prüffelder

Für einen kompakten Relational-Selection-Eintrag genügen v1 diese Felder:

- `source_a`
- `source_b`
- `affinity_reason`
- `anti_affinity_reason`
- `pressure_gain`
- `truth_mix_risk`
- `fake_risk`
- `why_not_more`

Optional nur bei echtem Mehrwert:

- `candidate_block`
- `scope_cost`
- `decision`

## Leitwerte

### `truth_mix_risk`

Erlaubte Werte:

- `low`
- `medium`
- `high`

Frage:
Vermischt dieses Crossing operative Wahrheit, lokalen Drift und proposal-only Material auf eine Weise, die später falsche Sicherheit erzeugt?

### `fake_risk`

Erlaubte Werte:

- `low`
- `medium`
- `high`

Warnzeichen:

- klingt tief, bleibt aber operativ leer
- verfeinert die Methode, aber nicht den Maya-Hebel
- verbindet nur semantisch ähnliche Formulierungen
- macht den nächsten Block größer statt klarer

## Harte Regeln

- Affinität allein reicht nicht.
- Crossing ohne Gegenaffinität ist unvollständig.
- Beziehung ohne realen Hebelgewinn nicht promoten.
- `high` truth-mix-risk nicht still in Adoption überführen.
- `high` fake-risk nicht als starken Kandidaten ausgeben.
- Wenn kein bounded nächster Block formulierbar ist, bleibt der Kandidat Radar-Material.
- `why_not_more` ist Pflicht gegen Methodenüberbau.

## Minimalformat

```md
### Relational Selection Check

- source_a:
- source_b:
- affinity_reason:
- anti_affinity_reason:
- pressure_gain:
- truth_mix_risk:
- fake_risk:
- why_not_more:
```

## Verhältnis zu bestehenden Methoden

Dieser Check ersetzt nicht:

- Kompression
- Maya-Fit
- Crossing-Guardrails in `RADAR.md`
- Zerquetsch- und Täuschungs-Disziplin in `AGENTS.md`

Er ergänzt sie nur an einer engen Stelle:

- wenn ein Crossing nicht offensichtlich falsch,
- aber auch noch nicht klar genug für `maya_fit_high` ist

## Nicht-Ziele

Dieser Check soll nicht:

- eine neue Hauptarchitektur werden
- eine neue Pflichtmatrix für alle Kandidaten werden
- AICOS oder `RADAR.md` ersetzen
- automatische Entscheidungen treffen
- proposal-only Material zur aktiven Produktwahrheit machen

## Kurzes Urteil

Der Relational Selection Check ist nur dann nützlich, wenn er klein bleibt.

Sein Wert liegt nicht darin, mehr Methode zu erzeugen, sondern darin, schöne, aber unbrauchbare Synthesen früher zu stoppen und nur solche Beziehungen weiterzutragen, die für Maya repo-nah, bounded und tatsächlich hebelstark sind.
