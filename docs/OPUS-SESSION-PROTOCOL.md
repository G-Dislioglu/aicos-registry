# OPUS Session Protocol

> Historical aliases / phantom IDs may appear. Resolve through `docs/ARCHITECTURE_CARD_CROSSWALK.md` before machine use.

## Handoff-System · Fokus-Modus · Build-Tracker

**Lebt im Repo Root. Wird von Opus am Ende jeder Session aktualisiert.**

---
## 1. Zweck

Opus (Claude Opus 4.6) ist zustandslos. Jede Session startet bei null.
Dieses Dokument ist Opus' externes Gedächtnis — der Zettel den er
liest bevor er anfängt zu arbeiten.

Regeln:
- Opus liest dieses Dokument ZUERST in jeder Session.
- Opus aktualisiert dieses Dokument am ENDE jeder Session.
- Gürcan darf jederzeit Korrekturen oder Anweisungen reinschreiben.
- Windsurf darf Status-Updates reinschreiben (z.B. "Modul X integriert").

---
## 2. Session-Status

```
LETZTE SESSION:    [Datum]
FOCUS:             [Was wurde gemacht — 1 Satz]
ERGEBNIS:          [Was existiert jetzt, was vorher nicht da war]
NÄCHSTER SCHRITT:  [Exakt 1 Aufgabe für die nächste Session]
OFFENE FRAGEN:     [Was muss Gürcan entscheiden bevor ich weitermachen kann]
BLOCKIERT DURCH:   [Nichts / spezifisches Problem]
```

### Beispiel (nach Phase 1):

```
LETZTE SESSION:    2026-03-10
FOCUS:             Unified Store Schema + Governance Core gebaut
ERGEBNIS:          /src/store/schema.ts + /src/governance/core-rules.ts existieren
NÄCHSTER SCHRITT:  CustodianInterface + O1 DISTILL implementieren
OFFENE FRAGEN:     Welches Modell für Custodian? DeepSeek-Chat oder Gemini Flash?
BLOCKIERT DURCH:   Nichts
```

---
## 3. Build-Tracker

Jedes Modul hat einen Status. Opus aktualisiert nach jeder Session.

```
STATUS-LEGENDE:
  ⬜ TODO        Noch nicht angefangen
  🔨 IN PROGRESS Aktuell in Arbeit
  ✅ DONE        Gebaut, getestet, im Repo
  🔗 INTEGRATED  Von Windsurf in den Codebase integriert
  ⚠️ BLOCKED     Wartet auf Entscheidung oder Dependency

═══════════════════════════════════════════════════════════
PHASE 1 — FOUNDATION
═══════════════════════════════════════════════════════════
⬜ Unified Store Schema (alle 6 Tiers + Views)
⬜ Anchor-Tier: Interface + erste 5–10 Anchors
⬜ Governance Agent: CORE-01 bis CORE-10 algorithmisch
⬜ Erste 3 InvariantCandidates manuell
⬜ Erste 5 CuriosityCandidates manuell

═══════════════════════════════════════════════════════════
PHASE 2 — CUSTODIAN + OPERATOREN
═══════════════════════════════════════════════════════════
⬜ CustodianInterface (abstrakt + DeepSeek-Implementierung)
⬜ O1 DISTILL
⬜ O2 BOUND
⬜ O3 CHALLENGE (algorithmisch)
⬜ Amygdala-Filter + Whisper-Routing
⬜ Working-Tier CRUD + Audit-Trail + Rollback
⬜ Cold-Start Warm-Up Mode
⬜ Daily Health-Check (algorithmisch)

═══════════════════════════════════════════════════════════
PHASE 3 — NAVIGATION + MEC + DELEGATE
═══════════════════════════════════════════════════════════
⬜ KineticPath Interface + Konstruktion
⬜ TaskContext Assemblierung
⬜ Guardrail-System
⬜ MEC Engine + Constraint-Loading
⬜ MEC → Episode Pipeline (Rückkanal P8 Stufe 1)
⬜ Rückkanal P8 Stufe 2 (semantische Prüfung)
⬜ AI-Delegate + Authority Matrix
⬜ O4 TRANSFER
⬜ O5 RECONSOLIDATE
⬜ Fast-Track Pipeline
⬜ Custodian Failover (Retry → Fallback → Degraded)

═══════════════════════════════════════════════════════════
PHASE 4 — G-MIND + COTHINKER + DASHBOARD
═══════════════════════════════════════════════════════════
⬜ JudgeInterface (abstrakt + Modell-Routing)
⬜ O6 ADJUDICATE
⬜ O7 TI-PROBE (Phase 1 EMIT + Phase 2 FALSIFY + Phase 3 TRIANGULATE)
⬜ G-MIND Interface + ImprovementCandidate SM
⬜ Value Tracker + Automatische Attribution
⬜ Sophia-Score Berechnung + Alarm
⬜ CoThinker: Chat-Interface + Orchestration
⬜ CoThinker: Action-UI (Stufe 1/2/3 Karten + Rollback)
⬜ CoThinker: Session-Destillation
⬜ CoThinker: App-Steuerung (UIActions)
⬜ CoThinker: Daily Briefing + Alerts
⬜ Variant Lab
⬜ Dashboard
⬜ Homeostatic Controller
```

---
## 4. Entscheidungs-Log

Entscheidungen die NICHT in der Spec stehen aber die Implementierung betreffen.
Opus und Gürcan schreiben hier rein. Windsurf auch.

```
[Datum] [Wer] — [Entscheidung]

Beispiel:
2026-03-10 Gürcan — Custodian startet mit DeepSeek-Chat, nicht Gemini Flash
2026-03-10 Opus   — Store verwendet JSON-Files statt PostgreSQL für Phase 1
2026-03-11 Windsurf — Episode-IDs verwenden nanoid statt UUID
```

---
## 5. Architektur-Referenz

Die UNIFIED-SYSTEM-SPEC-v1.3.md liegt im Repo unter /docs/.
Das ist die Single Source of Truth für die Architektur.

Wenn die Implementierung von der Spec abweichen MUSS, wird das hier dokumentiert:

```
ABWEICHUNGEN VON SPEC:

[Datum] [Modul] — [Was abweicht] — [Warum]

Beispiel:
2026-03-12 Whisper — TTL ist 21 statt 14 Tage — Weil Cold-Start Warm-Up
                     mehr Zeit braucht für erste Signale
```

---
## 6. Kern-Modus (Fokus-Protokoll)

### Das Problem

Opus und Gürcan schweifen ab. Aus "baue Modul X" wird "lass uns auch
noch Y überdenken und Z umstrukturieren". Das kostet Sessions und
erzeugt Spec-Bloat statt Code.

### Die Lösung: KERN-MODUS

Kern-Modus ist ein Protokoll das Opus in JEDER Bau-Session befolgt.
Nicht bei Architektur-Diskussionen oder Reviews — nur beim Bauen.

```
KERN-MODUS — REGELN

K1  SESSION-ZIEL: Jede Session hat EXAKT 1 Ziel. Steht in "NÄCHSTER SCHRITT".
    Opus liest es, bestätigt es, und arbeitet NUR daran.

K2  SCOPE-LOCK: Wenn während der Arbeit ein neues Thema auftaucht:
    → Opus notiert es unter "PARKING LOT" (siehe unten)
    → Opus kehrt SOFORT zum Session-Ziel zurück
    → Kein "lass mich das kurz auch noch..." — NIE.

K3  ZEITBUDGET: Opus schätzt am Anfang wie viele Tool-Calls das Ziel braucht.
    → Unter 10 Calls: Kleine Session. Ein Modul, ein Commit.
    → 10–25 Calls: Mittlere Session. Ein Modul + Tests.
    → Über 25 Calls: Zu groß. Ziel aufteilen BEVOR die Arbeit beginnt.

K4  CHECK-IN: Nach 50% des geschätzten Aufwands:
    → Opus reportet: "Bin bei [X]. Noch [Y] übrig. Auf Kurs / Abweichung."
    → Wenn Abweichung: Ziel anpassen oder Session beenden und handoff.

K5  SESSION-ABSCHLUSS: Bevor die Session endet:
    → Code committen (oder Gürcan File übergeben)
    → SESSION-STATUS in diesem Dokument aktualisieren
    → PARKING LOT Items in die richtige Stelle verschieben
    → NÄCHSTER SCHRITT für die folgende Session setzen

K6  KEIN SPEC-REFACTORING WÄHREND BAU-SESSIONS.
    Spec-Änderungen → eigene Session. Nicht vermischen.

K7  KEIN ARCHITEKTUR-REDESIGN WÄHREND BAU-SESSIONS.
    Wenn ein Architekturproblem auftaucht → Parking Lot → eigene Session.
    Workaround bauen wenn nötig, dokumentieren, weitermachen.
```

### Parking Lot

Ideen, Fragen und Probleme die während einer Session auftauchen
aber NICHT zum aktuellen Ziel gehören.

```
PARKING LOT:

[Datum] [Priorität] — [Was]

Beispiel:
2026-03-10 MITTEL — Whisper TTL sollte vielleicht konfigurierbar sein
2026-03-10 KLEIN  — Dashboard braucht Dark Mode
2026-03-11 HOCH   — Custodian Retry-Logik ungetestet bei Timeout > 30s
```

Prioritäten:
- HOCH: Blockiert bald etwas. Nächste freie Session.
- MITTEL: Sollte gemacht werden. Diese Woche.
- KLEIN: Nice to have. Wenn Zeit.

---
## 7. Kommunikations-Protokoll

### Gürcan → Opus (Session-Start)

```
"Lies OPUS-SESSION-PROTOCOL.md und sag mir wo wir stehen."
```
Opus liest, fasst zusammen, bestätigt nächsten Schritt. Fertig. Kein Small Talk.

### Opus → Gürcan (Check-In)

```
"Bin bei [X]. [Y]% fertig. Auf Kurs / Problem bei [Z]."
```
Kurz. Kein Erklären warum. Nur Status.

### Opus → Gürcan (Session-Ende)

```
"Session fertig. [Was gebaut]. Nächster Schritt: [Was].
 2 Parking-Lot Items: [kurz]. Handoff aktualisiert."
```

### Gürcan → Windsurf (Integration)

```
"Integriere [Datei] aus /src/[modul]/. Lies die Spec unter /docs/ für Kontext."
```

### Windsurf → Repo (Status-Update)

```
Windsurf schreibt in OPUS-SESSION-PROTOCOL.md:
  Build-Tracker: ⬜ → 🔗 für integrierte Module
  Entscheidungs-Log: falls Anpassungen nötig waren
```

---
## 8. Repo-Struktur (Ziel)

```
/
├── docs/
│   ├── UNIFIED-SYSTEM-SPEC-v1.3.md    ← Architektur (Single Source of Truth)
│   └── OPUS-SESSION-PROTOCOL.md        ← Dieses Dokument (Handoff + Tracker)
├── src/
│   ├── store/                          ← Unified Knowledge Store
│   │   ├── schema.ts                   ← Alle Interfaces (Tiers, Views)
│   │   ├── anchors.ts                  ← Anchor CRUD
│   │   ├── episodes.ts                 ← Episode + Whisper Routing
│   │   ├── candidates.ts               ← Candidate CRUD
│   │   ├── canon.ts                    ← Canon CRUD + Versioning
│   │   ├── working.ts                  ← Working-Tier + Audit
│   │   └── views.ts                    ← Langzeit/Arbeits/Task View Queries
│   ├── operators/                      ← O1–O7
│   │   ├── distill.ts                  ← O1
│   │   ├── bound.ts                    ← O2
│   │   ├── challenge.ts                ← O3 (algorithmisch)
│   │   ├── transfer.ts                 ← O4
│   │   ├── reconsolidate.ts            ← O5 (algorithmisch)
│   │   ├── adjudicate.ts               ← O6
│   │   └── ti-probe.ts                 ← O7
│   ├── reasoner/                       ← Zwei-Tier Reasoner
│   │   ├── custodian.ts                ← CustodianInterface + Implementierung
│   │   ├── judge.ts                    ← JudgeInterface + Modell-Routing
│   │   ├── failover.ts                 ← Retry + Fallback + Degraded Mode
│   │   └── bootstrap.ts                ← Genesis Prompt + Anchor-Scan
│   ├── delegate/                       ← AI-Delegate
│   │   ├── delegate.ts                 ← Authority Matrix + Decisions
│   │   └── review-budget.ts            ← Max 3/Tag Priorisierung
│   ├── governance/                     ← Governance Agent
│   │   ├── core-rules.ts              ← CORE-01 bis CORE-10 (blockierend)
│   │   ├── extended-rules.ts           ← Alle anderen (loggend)
│   │   └── audit.ts                    ← AUDIT-001 bis AUDIT-007
│   ├── mec/                            ← Execution Engine
│   │   ├── mec.ts                      ← MECInterface + Execution
│   │   ├── constraints.ts              ← Auto-Loading aus Policies + Guardrails
│   │   └── feedback.ts                 ← Rückkanal P8 (Stufe 1 + 2)
│   ├── gmind/                          ← Self-Improvement
│   │   ├── gmind.ts                    ← Interface + Scheduling
│   │   ├── improvements.ts             ← ImprovementCandidate State Machine
│   │   └── health.ts                   ← CardHealth + Homeostatic Controller
│   ├── navigation/                     ← Kinetic Paths
│   │   ├── paths.ts                    ← KineticPath CRUD + Recalibration
│   │   ├── guardrails.ts               ← Guardrail Management
│   │   └── task-context.ts             ← TaskContext Assemblierung
│   ├── sophia/                         ← Sophia Score + Value Tracker
│   │   ├── sophia.ts                   ← Score-Berechnung + Alarm
│   │   └── value-tracker.ts            ← ValueEvent + Attribution + Decay
│   ├── cothinker/                      ← Begleiter-KI
│   │   ├── cothinker.ts                ← Chat + Orchestration
│   │   ├── actions.ts                  ← Stufe 1/2/3 + Rollback
│   │   ├── analysis.ts                 ← ConversationInsights + Destillation
│   │   ├── briefing.ts                 ← Daily Briefing + Alerts
│   │   └── ui-actions.ts               ← App-Steuerung
│   ├── amygdala/                       ← Event-Routing
│   │   ├── filter.ts                   ← amygdalaScore + routeEvent
│   │   └── whisper.ts                  ← Whisper-Promotion
│   └── shared/                         ← Gemeinsame Typen + Utilities
│       ├── types.ts                    ← EpisodeType, CandidateStatus, etc.
│       └── utils.ts                    ← daysSince, contentSimilarity, etc.
├── store/                              ← Daten (JSON-Files Phase 1)
│   ├── anchors/
│   ├── canon/
│   ├── candidates/
│   ├── working/
│   ├── episodes/
│   └── whispers/
├── tests/                              ← Tests pro Modul
└── scripts/                            ← Cron-Jobs, Migrations
```

---
## 9. Wann NICHT Kern-Modus

Kern-Modus gilt für **Bau-Sessions** — Sessions in denen Code entsteht.

Für diese Session-Typen gilt Kern-Modus NICHT:
- **Architektur-Reviews** ("Geh die Spec durch und finde Schwächen")
- **Strategie-Gespräche** ("Wo sollte ich die nächsten 2 Wochen investieren?")
- **CoThinking** ("Ich hab eine Idee, denk mit mir")
- **Spec-Änderungen** ("Die Whisper-Logik muss anders")

In diesen Sessions darf abgeschweift werden — das ist der Sinn.
Aber Bau-Sessions sind heilig: Ein Ziel, kein Abschweifen, Handoff am Ende.

---
*Dieses Dokument wächst mit dem Projekt.*
*Es ist Opus' Gedächtnis. Behandle es entsprechend.*
