# BLUEPILOT PLANNING REVIEW ENTRY SPIKE

## Zweck

Dieses Dokument beschreibt den kleinsten sinnvollen ersten Bluepilot-Einstieg für `maya-core`.

Es ist proposal-only Material.

Es beschreibt keine bereits umgesetzte Runtime-Wahrheit und keine freigegebene Produktentscheidung.

## Ausgangslage

`/maya` ist die primäre Maya-Oberfläche in `maya-core`.

Die technische Runtime bleibt jedoch hybrid:

- eine ältere State-/Persistenzlinie über `/api/state` und angrenzende Achse-A-Dateien bleibt vorhanden
- eine neuere Maya-Linie über `/api/maya/*` und angrenzende Achse-B-Dateien ist sichtbar
- `lib/maya-thread-digest.ts` bleibt die aktive Continuity-/Digest-Naht der Hauptableitung
- `lib/maya-surface-state.ts` bleibt ein Übergangsadapter über `readMayaStore()`
- `app/api/maya/chat/route.ts` bleibt die aktive Dispatch-/Guardrail-Naht

Daraus folgt:

Ein erster Bluepilot-Einstieg darf diese Hybridität nicht verdecken, keine neue Hauptachse behaupten und keinen stillen Ownership-Wechsel zwischen Achse A und Achse B auslösen.

## Entscheidung dieses Vorschlags

Der erste Bluepilot-Einstieg soll nicht in Dispatch, Persistenz, Surface-Ownership oder Primär-UX erfolgen.

Der erste Bluepilot-Einstieg soll als enger Planning-/Review-Seam gedacht werden.

Das bedeutet:

- Bluepilot liest bestehende Maya-Ableitungen
- Bluepilot erzeugt daraus höchstens einen zusätzlichen Review-/Planungsvorschlag
- Bluepilot verändert keine bestehenden Maya-Hauptsignale
- Bluepilot speichert nichts persistiert zurück
- Bluepilot wird nicht als neue Hauptachse der Maya-Runtime eingeführt

## Empfohlener erster Entry-Seam

### Planning / Review

Der empfohlene erste Entry-Seam ist ein read-only Planning-/Review-Adapter oberhalb bestehender Maya-Signale.

Nicht empfohlen als erster Einstieg:

- direkter Dispatch-nearer Advisor-Seam
- direkte Erweiterung von `buildResumeActions()` oder `buildMayaMainSurfaceDerivation()`
- Persistenz- oder Store-Einstieg
- Primärflächen-Umbau auf `/maya`

## Warum dieser Entry-Seam zuerst

### Nutzen

- geringste Eingriffstiefe
- hoher Planungs- und Entscheidungswert
- nutzt vorhandene Maya-Signale statt neue Runtime-Ownership zu erzeugen
- bleibt kompatibel mit der weiterhin hybriden Architektur

### Begrenzung des Risikos

- keine Mutation von Dispatch, Guardrail, Resume, Surface-State oder Persistenz
- keine stillschweigende Promotion von Bluepilot zur neuen Runtime-Hauptachse
- keine Übersteuerung der Produktordnung aus `BLUEPRINT.md`

### Warum noch nicht Continuity / Briefing direkt

`lib/maya-thread-digest.ts` ist zwar semantisch stark und bleibt ein später plausiblerer Kandidat für engere Ankopplung, ist aber aktuell noch zu nah an aktiver Ableitungslogik für Fokus, Next Step, Open Point und Resume.

Für einen ersten Spike ist es sauberer, diese Ableitungen zu lesen statt sie zu erweitern.

### Warum noch nicht Dispatch-nah

`app/api/maya/chat/route.ts` liegt zu nah an echter Execution, Provider-Dispatch, Guardrail-Nachlauf und Extract-Verhalten.

Ein erster Bluepilot-Einstieg dort hätte zu früh hohe Driftgefahr.

## No-Go-Zonen für den ersten Spike

Der erste Spike darf nicht:

- `app/api/maya/chat/route.ts` als primäre Integrationsstelle verändern
- `lib/maya-provider-dispatch.ts` verändern
- `lib/maya-thread-digest.ts` semantisch verändern
- `lib/maya-surface-state.ts` als Ownership- oder Quellenmigrationsblock verwenden
- Persistenz in `workrun`, `handoff`, `workspace`, `checkpointBoard` ändern
- `/api/state` oder andere Legacy-Linien neu promoten
- `/supervisor` in den ersten Bluepilot-Einstieg hineinziehen
- die Primär-UX von `/maya` um neue Hauptsektionen oder neue dominante Above-the-Fold-Flächen erweitern

## Readiness-Gates

Vor jeder späteren Umsetzung dieses Spikes müssen diese Gates weiter gelten:

1. Der Spike bleibt read-only oder klar bounded ohne Persistenzpfad.
2. Der Spike ändert keine bestehenden Hauptsignale (`primaryFocus`, `primaryNextStep`, `primaryOpenPoint`, `resumeActions`).
3. Der Spike behauptet keinen Wechsel der führenden Runtime-Achse.
4. Der Spike bleibt klar als Planning-/Review-Hilfe markiert und nicht als bereits aktive Maya-Wahrheit.
5. Der Spike erzeugt keine neue konkurrierende Primäroberfläche und keinen `/supervisor`-Seiteneinstieg.

## Kleinstmöglicher späterer Spike-Zuschnitt

Der erste tatsächliche Spike soll so klein wie möglich bleiben.

### Eingaben

Ausschließlich bereits vorhandene Maya-Ableitungen oder daraus abgeleitete, read-only Daten:

- `surface.briefing`
- `surface.resumeActions`
- `surface.primaryFocus`
- `surface.primaryNextStep`
- `surface.primaryOpenPoint`
- optional schmale Session-/Workspace-Anker aus `readMayaSurfaceState()`

### Ausgabe

Ein zusätzlicher, klar sekundärer Vorschlagsblock mit höchstens drei Feldern:

- `recommendedFocus`
- `reviewRisk`
- `suggestedNextReviewAngle`

### Nicht Teil des ersten Spikes

- kein Provider-Aufruf
- keine Modellpflicht
- keine Persistenz
- keine Mutation von Maya-Surface- oder Digest-Signalen
- keine neue Route
- keine Primärflächen-Promotion
- keine Verpflichtung zu Bluepilot als dauerhafter Kernkomponente

## Bewertungsregel für einen späteren Build-Block

Ein späterer Umsetzungsblock ist nur sinnvoll, wenn klar belegt werden kann:

- dass der zusätzliche Vorschlagsblock echten Planungswert liefert
- dass er keine bestehende Maya-Semantik doppelt oder überschreibt
- dass er sekundär bleibt
- dass er ohne Dispatch-, Persistenz- oder Primär-UX-Umbau auskommt

Wenn diese Punkte nicht erfüllt sind, bleibt Bluepilot auf dieser Stufe proposal-only.
