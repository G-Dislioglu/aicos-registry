# Proposal: Maya Companion Surface Refresh
**Status:** PROPOSAL · Noch nicht umgesetzt · Stand 22.03.2026  
**Scope:** UI/UX-Reordnung von `/maya` — kein Backend, kein neuer Stack

---

## Problemstatement

Die aktuelle `/maya`-Hauptfläche hat nach Analysebefund viele gleichrangige Sektionen, zahlreiche Aktionen ohne klare Dominanz, mehrfach wiederkehrenden Placeholder- oder Füllinhalt und den Composer als primäre Nutzerinteraktion nicht früh genug im sichtbaren Erstbereich.

Das Resultat: Die Fläche orientiert nicht stabil genug, sondern wirkt schnell überladen.
Ein Nutzer soll innerhalb weniger Sekunden erkennen können, was der nächste sinnvolle Schritt ist. Dieser Zustand ist aktuell nicht verlässlich erreicht.

---

## Zielbild: Companion Surface statt Dashboard

Maya führt — die UI erklärt nicht alles gleichzeitig.

### 4 Kern-Elemente above the fold

```text
┌─────────────────────────────────────────┐
│  1. MAYA BRIEF                          │
│     Ein Satz — was gerade los ist       │
│     Mirror-Prinzip: erst spiegeln       │
├─────────────────────────────────────────┤
│                                         │
│  2. NEXT STEP HERO                      │
│     Eine klare Primäraktion             │
│     Max. 2 sekundäre Aktionen           │
│                                         │
├─────────────────────────────────────────┤
│  3. CONTEXT-STRIP                       │
│     Fokus · Blocker · Status · Vertrauen│
├─────────────────────────────────────────┤
│  4. COMPOSER                            │
│     Immer erreichbar · Größtes Target   │
└─────────────────────────────────────────┘
```

### Aktionshierarchie

- 1 primäre Aktion sichtbar und dominant
- maximal 2 sekundäre Aktionen im direkten Umfeld
- alles Weitere: Overflow, Lens oder Drawer

### Ops Lens

Alles, was heute dauerhaft sichtbar ist und nicht zur Primärführung gehört, soll in eine auslagerbare Lens-/Drawer-Logik verschoben werden, zum Beispiel:
- Fadenkompass (Volltext)
- Checkpoints
- Signal-Bars / Director Prompt
- Thread-Liste

---

## Die 4 Screen-Modi

| Screen | Wann | Kern-Inhalt |
|---|---|---|
| Fokus | aktive Arbeitssession | 4 Kernelemente above the fold |
| Re-Entry | Wiedereinstieg nach Pause | Briefing + Assumption-Check + 2 Wege |
| Chat | Exploration / Fragen | Chat + Context-Strip + Composer |
| Review | Block-Ende | Erreicht · Offen · Nächster Block |

Re-Entry bleibt strikt getrennt von Tuning oder Settings.

---

## Priorisierte Umbau-Schritte

1. Fokus-Screen: 4 Kernelemente above the fold, Rest in Lens/Drawer
2. Composer ohne Scrollen erreichbar machen
3. rechte Dauer-Rail in eine gezielte Ops-Lens überführen
4. Re-Entry sauber von Tuning trennen
5. Placeholder-Füllinhalt durch echten Kontext ersetzen
6. Präsenz- und Zustandslogik der Oberfläche vereinheitlichen

---

## Non-Goals dieses Proposals

- Kein Backend-Umbau
- Kein neuer Stack
- Keine Motion-/Rive-/Animations-Pflicht in diesem Block
- Kein Council/Intent-Resolver/Multi-Agent als Pflicht für diese Ausbaustufe
- Keine neuen Datenmodelle
- Kein Löschen von Funktionen als Erstmaßnahme — zunächst Reorganisation der Sichtbarkeit

---

## Referenzen

- `BLUEPRINT.md` — Produktentscheidung und Raumlogik
- `STATUS.md` — aktueller sichtbarer Stand und UX-Befund
- `components/app-shell.tsx` — aktuelle Shell-Struktur mit Rail/Header/Nebenfläche
- `components/primary-nav.tsx` — aktuelle Routenhierarchie in der Navigation
- `components/maya-chat-screen.tsx` — aktuelle Hauptfläche mit hoher inhaltlicher Dichte
- AICOS `meta-001`, `meta-003`, `err-cross-001`, `sol-maya-001`

---

## Akzeptanzkriterien

Dieser Proposal gilt als umgesetzt, wenn:
- [ ] `/maya` above the fold genau vier dominante Kernelemente zeigt
- [ ] der Composer ohne Scrollen erreichbar ist
- [ ] sekundäre Inhalte nicht mehr als dauerhafte gleichrangige Hauptpanels erscheinen
- [ ] Placeholder- oder Fülltext nicht mehr als Hauptinhalt dient
- [ ] die Hauptfläche keine Vielzahl gleichwertiger Primäraktionen mehr zeigt
- [ ] Re-Entry von Tuning oder technischen Detailflächen getrennt ist
