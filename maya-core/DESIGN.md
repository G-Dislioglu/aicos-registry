# Maya — DESIGN.md
> Agent-readable design specification · Maya Webapp v4.3+
> Lies diese Datei bevor du Maya-UI-Komponenten generierst,
> modifizierst oder reviewst.

## Identität & Tonalität
Maya ist ein persönlicher KI-Begleiter — keine App, keine
Plattform, kein Tool. Visuell: warm, organisch, lebendig —
niemals kalt, klinisch oder corporate.

## Farbsystem
bg-base: #0a0a0f · bg-surface: #111118 · bg-elevated: #1a1a24
presence: #7c6af7 (Mayas Signaturfarbe — Violett)
presence-glow: rgba(124,106,247,0.15)
memory-amber: #f5a623 (NUR für Memory-Chips)
text-primary: rgba(255,255,255,0.92)
text-secondary: rgba(255,255,255,0.60)
border-subtle: rgba(255,255,255,0.06)
border-focus: rgba(124,106,247,0.45)

## Typografie
Primär: Inter · Mono: JetBrains Mono (für Memory-IDs)
Body: 14px/1.6 · Heading: 18-24px/600

## Screen-Modi (Maya entscheidet)
focus    — aktive Session · 4 Elemente above fold
re-entry — Pause >30min · Briefing + Assumption-Check
chat     — Exploration · Chat-Verlauf + Composer
review   — Block-Ende · Erreicht/Offen/Nächster Block

## Kernkomponenten

### Presence Orb
48px/64px/96px · Kreis · Gradient #7c6af7→#4f46e5
idle: Pulsieren 4000ms · thinking: Shimmer
speaking: Wellenanimation · listening: 1500ms schneller

### Chat-Nachrichten
User: bg #1a1a24 · border-radius 16px 16px 4px 16px
Maya: KEIN Bubble · border-left 2px rgba(124,106,247,0.35)
Streaming-Cursor: | blinkt 900ms · Farbe #7c6af7

### Memory Chips
Inline in Mayas Text · bg rgba(245,166,35,0.10)
border rgba(245,166,35,0.28) · color #f5a623
NIEMALS als Block-Element

### Icon Rail
56px · bg #0d0d14 · border-right rgba(255,255,255,0.05)
Aktiv-Indikator: 2px · #7c6af7 · left: 0

### Ops Lens (Drawer)
position: fixed right · width: 320px · bg #0d0d14
border-left: 1px solid rgba(255,255,255,0.06)
Enthält: Fadenkompass · Checkpoints · Signal-Bars
Öffnet per Icon-Rail oder maya.intent.openOpslens()

### Context-Strip
height: 36px · fixed bottom · 4 Felder:
Focus · Blocker · Status · Vertrauen
Vertrauen-Farbe: rgba(124,106,247,0.8) wenn hoch
                 #fb923c wenn LOW/STALE
STALE-Trigger-Regel:
Vertrauen-Feld wird auf STALE gesetzt wenn:
- Kein Nutzer-Input seit >10 Turns
- Letzter Check-Point >30 Minuten zurück
- Maya erkennt Widerspruch zu bekanntem Kontext
Bei STALE: Farbe wechselt zu #fb923c (warning)
Bei STALE: Composer-Placeholder ändert sich zu
"Kurze Lage-Einschätzung bevor wir weitermachen?"

### Composer (Eingabe)
bg #0e0e16 · border rgba(255,255,255,0.08) · radius 12px
Focus: border rgba(124,106,247,0.45)
Placeholder: "Flüstern..." — NICHT "Nachricht eingeben"

### Buttons
Primär: bg #7c6af7 · hover: #6b5ce7
Sekundär: bg rgba(124,106,247,0.10)
Ghost: transparent · hover rgba(255,255,255,0.05)

## Layout Desktop (≥1024px)
[Icon Rail 56px][Sidebar 280px][Main flex-1]
Max Chat-Breite: 720px

## Motion
Standard: 200ms ease · Smooth: 300ms ease-out
Orb-Puls: 4000ms infinite · Entry: translateY(8px)→0

## Agenten-Anweisungen
1. Hintergrund IMMER dunkel — Basis #0a0a0f
2. Violett #7c6af7 sparsam — nur interaktive/aktive States
3. Amber #f5a623 NUR für Memory-Elemente
4. WCAG AA Kontrast — 4.5:1 minimum
5. Keine weißen Flächen — auch nicht in Modals
6. Motion subtil — lebendig, nicht flashy
7. Presence Orb ist heilig — nie ersetzen
8. Touch-Targets ≥44px (Mobile)

## Re-Entry Assumption-Struktur
Wenn Maya den Re-Entry-Screen zeigt, deklariert sie
Annahmen in dieser Form (max 3):
 
assumption_text: Was Maya annimmt
type: data | definition | constraint | context
confidence_hint: low | med | high
 
Beispiel:
- "Du arbeitest noch am selben Thema wie gestern"
  → type: context · confidence_hint: med
- "Der letzte Block ist abgeschlossen"
  → type: constraint · confidence_hint: high
 
Keine Annahme ohne confidence_hint.
Annahmen mit low → immer als Frage formulieren,
nie als Aussage.

## Verbotene Muster
❌ Weiße oder helle Hintergrundflächen
❌ Jade-Grün (#1D9E75) in Maya-UI — das ist Bluepilots Farbe
❌ Mehr als 4 Elemente above fold im Fokus-Screen
❌ Composer unterhalb des Viewports ohne Scrollen
❌ Dashboard-Layout mit gleichrangigen Sektionen
❌ Spinner (prefer Shimmer-Skeleton)
❌ Harte drop-shadows (prefer glow)
❌ Modale über Modalen
