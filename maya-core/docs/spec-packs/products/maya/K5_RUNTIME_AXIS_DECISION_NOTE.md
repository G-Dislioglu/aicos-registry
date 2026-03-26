# K5 Runtime Axis Decision Note

## Zweck

Diese Notiz hält K5 Block 1 als reinen Dokumentationsblock fest.

Sie ersetzt weder `BLUEPRINT.md` noch behauptet sie, dass die technische Maya-Konsolidierung bereits umgesetzt ist.
Sie präzisiert nur den belastbaren Ausgangspunkt für die nächsten K5-Folgeschritte.

## Scope dieses Blocks

- nur Dokumentation
- keine Codeänderung
- keine neue UI-Reorganisation
- keine Behauptung, dass bereits eine vollständig einheitliche Runtime-Achse produktiv aktiv ist

## Repo-sichtbarer Ist-Zustand

`/maya` ist als sichtbare Produktfläche entschieden primär.

Technisch läuft diese Primärfläche aktuell hybrid über zwei Achsen:

### Achse A — Legacy/Product-State

Trägt aktuell die sichtbare Session-, Workspace- und Persistenzkontinuität.

- `app/maya/page.tsx`
- `app/layout.tsx`
- `components/maya-state-provider.tsx`
- `app/api/state/route.ts`
- `app/api/chat/route.ts`
- `lib/maya-store.ts`
- `lib/maya-thread-digest.ts`

### Achse B — Maya Runtime / Execution

Trägt aktuell Provider-Auswahl, Modell-Dispatch und nachgelagerte Extraktionslogik.

- `app/api/maya/chat/route.ts`
- `lib/maya-provider-dispatch.ts`
- `lib/maya-memory-store.ts`
- `lib/maya-cognitive-engine.ts`
- `lib/maya-provider-registry.ts`

## K5 Block 1 — Entscheidungsstand

### 1. Produkt-Primacy bleibt unverändert

- `/maya` bleibt die kanonische sichtbare Maya-Hauptfläche
- `/chat` bleibt legacy / explorativ
- `/context` bleibt unterstützend
- `/supervisor` bleibt intern

### 2. Technischer Befund

Die aktuelle `/maya`-Runtime ist nicht rein Achse A und nicht rein Achse B, sondern hybrid.

- Achse A liefert aktuell den sichtbaren Zustands- und Kontinuitätsrahmen
- Achse B liefert aktuell die modell- und providerbezogene Ausführung

### 3. K5-Entscheidung für die weitere Konsolidierung

Für die weitere K5-Konsolidierung gilt:

- Achse B ist die **kanonische Zielachse für neue Maya-Execution-Logik**
- Achse A bleibt **vorerst die autoritative Kontinuitäts- und Persistenzachse**, bis ein geplanter Migrationspfad steht
- K5 Block 1 erklärt **nicht**, dass Achse B bereits heute die alleinige Maya-Gesamtachse ist

### 4. Übergangsgrenzen

Bis zu einer späteren Umstellung gelten folgende Grenzen:

- Neue Provider-, Modell-, Dispatch- und Extract-Logik gehört in Achse B
- Neue Persistenz-, Session- und Kontinuitätslogik darf Achse A nicht unkontrolliert weiter vertiefen
- `/api/chat` ist als Legacy-/Adapterpfad zu behandeln, nicht als Zielpfad für neue Hauptlogik
- `/api/state` und `maya-store.ts` bleiben vorerst nötig, solange `/maya` sichtbar und strukturell daran hängt

## K5-Konsolidierungsplan

### Phase A — Führung festlegen

Ziel:

- die Zielachse und die Übergangsgrenzen explizit markieren

Betroffene Dateien:

- `docs/spec-packs/products/maya/K5_RUNTIME_AXIS_DECISION_NOTE.md`
- `docs/spec-packs/products/maya/STATUS.md`
- `AGENTS.md`
- optional später `BLUEPRINT.md`, wenn aus Vorbereitung eine formale Architekturentscheidung wird

### Phase B — Adapter markieren

Ziel:

- Legacy-/Adapterpfade sichtbar markieren, ohne sie sofort zu entfernen

Betroffene Dateien:

- `app/api/chat/route.ts`
- `app/api/state/route.ts`
- `components/maya-state-provider.tsx`
- `components/maya-chat-screen.tsx`
- `lib/maya-store.ts`

### Phase C — Call-Sites benennen und umstellen

Ziel:

- alle Stellen benennen, an denen `/maya` noch direkt auf Achse A als Hauptpfad zugreift
- schrittweise Umstellung auf klar lesbare Übergabepunkte

Betroffene Dateien:

- `app/maya/page.tsx`
- `app/layout.tsx`
- `components/maya-chat-screen.tsx`
- `components/maya-state-provider.tsx`
- `app/api/chat/route.ts`
- `app/api/maya/chat/route.ts`

### Phase D — Legacy zurückbauen

Ziel:

- erst nach stabiler Ersatzlogik alte Hauptpfade abbauen

Betroffene Dateien:

- `app/api/chat/route.ts`
- `components/maya-state-provider.tsx`
- `app/api/state/route.ts`
- `lib/maya-store.ts`
- gegebenenfalls betroffene Digest-/Kontinuitätsadapter

## Betroffene Dateien-Liste nach Verantwortungsbereich

### Sichtbare Hauptfläche

- `app/maya/page.tsx`
- `components/maya-chat-screen.tsx`
- `app/layout.tsx`

### Legacy/Product-State-Achse

- `components/maya-state-provider.tsx`
- `app/api/state/route.ts`
- `app/api/chat/route.ts`
- `lib/maya-store.ts`
- `lib/maya-thread-digest.ts`

### Maya Runtime / Execution

- `app/api/maya/chat/route.ts`
- `lib/maya-provider-dispatch.ts`
- `lib/maya-provider-registry.ts`
- `lib/maya-memory-store.ts`
- `lib/maya-cognitive-engine.ts`

## Nicht entschieden in K5 Block 1

- keine vollständige Abschaltung von Achse A
- keine sofortige Migration der sichtbaren `/maya`-Fläche auf nur eine Runtime-Achse
- keine Änderung an Routing, `app-shell.tsx` oder `primary-nav.tsx`
- keine neue UI-Reorganisation über K4 hinaus

## Empfohlener nächster K5-Folgeschritt

K5 Block 2 sollte die Adapterstellen konkret markieren und die ersten echten Call-Sites aufnehmen, ohne bereits einen Big-Bang-Umbau zu erzwingen.
