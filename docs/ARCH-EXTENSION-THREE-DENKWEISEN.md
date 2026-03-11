# Architecture Extension: Three Denkweisen

> Historical aliases / phantom IDs may appear. Resolve through `docs/ARCHITECTURE_CARD_CROSSWALK.md` before machine use.

## Algorithmic Reasoning · NumDSL · KI-native Schichtung
**Ergänzung zur UNIFIED-SYSTEM-SPEC v1.3**

---
## Ursprung

Drei Quellen fließen zusammen:
- **aicos-maya-02** "maya_algorithmic_bridge": Maya als Algorithmus, nicht als KI-Modell
- **DSL-Arbeiten** aus Artifex/Bluepilot: Kompakte Maschinensprache, 85–95% Token-Einsparung
- **Drei-Tier-Modell** aus v1.3: Algorithmic Engine + Custodian + Judge

Die Kernfrage: Das System imitiert menschliche Kognition (Amygdala, Gedächtnis-Schichten, Intuition). DNA-Prinzip 06 sagt "OWN PATH — Imitation ist ein Failure Mode." Wie denkt KI nativ?

---
## 1. Drei Denkweisen

```
ALGORITHMUS denkt in:  Struktur, Muster, Frequenz, Graphen, Logik
LLM denkt in:          Bedeutung, Kontext, Kreativität, Analogie
COTHINKER spricht in:  Menschliche Sprache, Metaphern, Empathie

Keine imitiert die andere. Jede macht das was sie am besten kann.
```

### Was jede Denkweise löst

| Reasoning-Typ | Algorithmus | LLM | Beispiel |
|---|---|---|---|
| Pattern Match | ✅ voll | — | "3 Episodes gleiche Domain + Error-Typ" |
| Inference (A→B→C) | ✅ voll | — | "batch>3s → latency↑ → satisfaction↓" |
| Contradiction | ✅ auf DSL | bestätigt | "Episode widerspricht Canon-Invariant" |
| Abduction | ✅ Ranking | ✅ Mechanismus | Algo rankt, LLM erklärt warum |
| Temporal | ✅ voll | — | "Fix hat nicht gehalten — recurring" |
| Cross-Domain | ⚠️ Keyword | ✅ Validierung | Algo findet Match, LLM prüft Analogie |
| Counterfactual | ⚠️ strukturell | ✅ kreativ | Algo entfernt Invariant, LLM denkt weiter |
| Analogy | ❌ | ✅ voll | Braucht semantisches Verständnis |
| Synthesis | ❌ | ✅ voll | Braucht kreatives Sprachverständnis |

**~60% aller Reasoning-Operationen sind algorithmisch lösbar wenn die Daten in DSL vorliegen.**

---
## 2. NumDSL — Die Kommunikationssprache

### 2.1 Regel

```
INNERHALB eines LLM-Calls: Denken in natürlicher Sprache.
  LLMs sind besser im Reasoning wenn sie in Sprache denken.

ZWISCHEN Agents: Kommunikation in DSL.
  Kein Agent sendet Freitext an einen anderen.

ZUM MENSCHEN: Nur CoThinker spricht menschlich.
  Der Mensch sieht NIE DSL.
  CoThinker übersetzt in beide Richtungen.
```

### 2.2 Syntax

```
GRUNDSTRUKTUR:  VERB:domain.subdomain|param:value|param:value

VERBEN:
  EP       Episode          WH       Whisper
  INV      Invariant        BOUND    Boundary
  REVIEW   Review-Anfrage   VERDICT  Review-Ergebnis
  EXEC     MEC Execution    PROBE    TI-PROBE
  DISTILL  O1 triggern      ALERT    Proaktives Signal
  PATH     Path-Operation   HEALTH   Health-Report
  Q        Query            SCOUT    Scout-Auftrag
  RESULT   Scout-Ergebnis   ACK/NACK Bestätigung/Ablehnung
  ROLL     Rollback

PARAMETER:
  conf: Confidence    ep:  Episode-Count/IDs   dom: Domain
  src:  Source        tgt: Target              act: Action
  rea:  Reason        pri: Priority (1–5)      ttl: TTL (Tage)
  ws:   Wisdom Score  vs:  Value Score         gate: Gate-Typ
  ctx:  Context-IDs   bound: Boundary (0/1)    press: Pressure
  fast: Fast-Track    rev: Reversible (0/1)

OPERATOREN:
  ∝ korreliert  > größer  < kleiner  = gleich
  ! negiert     & und     → führt zu  ? unsicher
  | Feld-Trenner
```

### 2.3 Beispiele

```
Episode:     EP:audio.tts|type:error|content:latency>3s|conf:0.8|src:mec
Whisper:     WH:audio.tts|type:observation|content:latency_spike|amyg:0.35
Distill:     DISTILL:audio.tts|ep:ep-041,ep-043,ep-047|trigger:cluster≥3
Invariant:   INV:audio.tts|principle:latency∝batch>3s|mech:buffer_overflow
             |conf:0.7|ep:3|bound:1|press:0.1|ws:0.45|fast:1
Review:      REVIEW:inv-cand-2026-008|gate:canon-local|ws:0.72|bound:1
Verdict:     VERDICT:inv-cand-2026-008|decision:promote|conf:0.85
             |rea:ws>0.7&press<0.3&bound=1|reviewer:delegate
Conflict:    EP:audio.tts|type:conflict|refutes:inv-2026-003|conf:0.6|src:mec
Execute:     EXEC:audio.tts|act:switch_tts|tgt:openai|rev:1|src:cothinker
Rollback:    ROLL:exec-2026-03-10-004|rea:user_request
Scout:       SCOUT:audio.tts|topic:latency_opt|max:5|src:ti-probe
Result:      RESULT:audio.tts|findings:3|f1:webrtc-40pct|f2:opus>mp3|f3:batch<2s
Health:      HEALTH:system|sophia:74|integrity:100|vitality:68|trend:stable
Alert:       ALERT:audio.tts|pri:2|content:whisper_expires_24h|ref:whi-2026-03-08-002
```

---
## 3. Drei-Tier Execution Model

### Tier 0 — Algorithmic Engine (lokal, $0, <10ms)

Keine KI. Reiner Code. ~80% aller Operationen.

```
DSL:
  → Parsing, Validierung, Routing

Governance:
  → CORE-01 bis CORE-10 als Regex auf DSL (~30 Zeilen Code)
  → Deterministische Prüfung. Keine Halluzination möglich.
  → Extended-Rules Logging

Algorithmisches Reasoning auf DSL-Daten:
  → Pattern Clustering (gleiche Domain + Type + Tokens → Cluster)
  → Contradiction Detection (Episode-Felder vs. Canon-Felder)
  → Inference Chains (A→B + B→C = A→C, Graphenalgorithmus)
  → Temporal Analysis (recurring-after-fix, regression-detection)
  → Cross-Domain Keyword-Match (Transfer-Kandidaten)
  → Hypothesis Ranking (Evidenz × Häufigkeit × vorhandene Fixes)
  → Frequency Analysis (dominante Tokens → wahrscheinlichste Ursache)

Store-Management:
  → Status-Maschinen-Übergänge
  → Canon-Export-Gate Prüfung
  → Homeostatic Controller + Value Tracker + Sophia-Score
  → TaskContext Assemblierung + Constraint-Loading
  → Amygdala-Filter + Whisper-Routing + Cold-Start

Scout-Vorarbeit:
  → Such-Queries aus DSL bauen (Template)
  → Such-APIs aufrufen (HTTP)
  → Ergebnisse vorfiltern
  → P8 Rückkanal Stufe 1 (Keyword-Match)
```

**Inspiriert durch aicos-maya-02:** Embedding-basierte Destillation, Clustering,
Scoring ohne KI-Calls. Die Card beschrieb den Tier 0 bevor er als Konzept existierte.

### Tier 1 — Custodian (günstige API, ~$0.002/Call, ~15%)

Denkt in Sprache, spricht in DSL. Tier 0 hat vorgearbeitet.

```
O1 DISTILL:  Tier 0 hat Cluster + Hypothesen-Ranking.
             Custodian: "Was ist der MECHANISMUS?" (30% LLM)
O2 BOUND:    Tier 0 hat Counterexamples + Edge Cases.
             Custodian: "Was sehen wir NICHT?" (50% LLM)
O4 TRANSFER: Tier 0 hat Keyword-Matches.
             Custodian: "Ist die Analogie VALIDE?" (40% LLM)
P8 Stufe 2:  Tier 0 hat Keyword-Match.
             Custodian: "Widerspricht das? YES/NO/UNCLEAR"
Destillation: Tier 0 hat nach Decay sortiert.
             Custodian: "Minimaler Satz an Wahrheiten?"
Path-Bau:    Tier 0 hat Context assembliert.
             Custodian: "Form der Lösung?"
Scout-Brain: Tier 0 hat Top-5 vorgefiltert.
             Custodian: "2–3 Kernfakten?"
```

### Tier 2 — Judge (starke API, ~$0.01–0.05/Call, ~5%)

Für echtes Reasoning. Selten, event-triggered.

```
O6 ADJUDICATE: Urteil unter Constraints
O7 TI-PROBE Phase 2+3: Falsifikation + Triangulation
AI-Delegate Reviews: Canon-Export, high-risk Decisions
CoThinker: Tiefe Fragen, WhatIf, Strategie

Modell: DeepSeek-Reasoner (empfohlen) oder Claude/GPT-5.4 (User wählt)
```

### Kostenvergleich

```
Vor Drei-Tier (v1.2):  100% LLM-Calls → ~$0.03–0.10/Durchlauf
Nach Drei-Tier (v1.3+): 80/15/5 Split → ~$0.005–0.02/Durchlauf

Einsparung: 60–80%
```

---
## 4. Scouts zerlegt

```
TIER 0 — SCOUT-ROUTER ($0):
  Wann suchen → Query bauen (Template) → API rufen → vorfiltern

TIER 1 — SCOUT-BRAIN (~$0.002):
  Top-5 bewerten → 2–3 Fakten → DSL-Output → Konflikte erkennen

TIER 2 — SCOUT-DEEP (~$0.01, selten):
  TI-PROBE Analogien → Widersprüche lösen → Tiefe Analyse
```

Bestätigt durch **aicos-scout-01**: Parallel, ohne Reasoning, für Divergenz.
Tier 0 übernimmt die Vorarbeit die vorher ein LLM verschwenderisch machte.

---
## 5. Governance auf DSL

```
CORE-01: if INV:* && !hasReviewRecord → BLOCK
CORE-02: if INV:* && bound:0 → BLOCK
CORE-05: if target:anchor && src:!human → BLOCK
CORE-07: if EXEC:* && src:!(cothinker|human|path|gmind) → BLOCK

10 CORE-Regeln = ~30 Zeilen Code. $0. Deterministische Prüfung.
Audit: grep "VERDICT.*promote" audit.log → alle Canon-Promotions.
```

---
## 6. CoThinker als Brücke

```
Human: "Die TTS ist langsam diese Woche."

CoThinker → Tier 0:
  Q:audio.tts|scope:episodes|days:7|type:error

Tier 0 → CoThinker:
  RESULT:audio.tts|count:4|types:error:3,fix:1
  |dominant:latency(3)|whispers:2|expires:3d

CoThinker → Human:
  "Audio hat 4 Probleme diese Woche, drei davon TTS-Latenz.
   Plus zwei Whispers die in 3 Tagen ablaufen.
   Soll ich eine Destillation starten?"
```

Verbindung zu **meta-004** "Meister-Brücke" und **meta-006** "Verbindung als Intelligenz":
Der CoThinker IST die Brücke. Nicht zwischen Technik und Menschlichkeit allein —
zwischen drei fundamental verschiedenen Denkweisen.

---
## 7. AICOS Cards die dieses Design vorhergesagt haben

| Card-ID | Token | Relevanz |
|---------|-------|----------|
| aicos-maya-02 | maya_algorithmic_bridge | Tier 0: Algorithmus statt KI für Clustering/Scoring |
| aicos-maya-01 | maya_observer_pattern | G-MIND: Beobachten → Destillieren → Verbessern |
| aicos-scout-01 | multi_scout_architecture | Scout-Zerlegung in parallele Tier-0-Vorarbeit |
| aicos-auto-01 | automatic_loop_control | AI-Delegate + Review-Budget (max 3 Schleifen) |
| aicos-role-03 | atlas_validator | Judge-Tier als finale Validierungsinstanz |
| err-arch-001 | infrastructure_for_infrastructure | WARNUNG: Tier 0 muss Code sein der Wert liefert, nicht Meta-Infrastruktur |
| meta-004 | meister_brücke | CoThinker als Brücke zwischen Denkweisen |
| meta-006 | verbindung_als_intelligenz | Verbindung IST die Intelligenz — nicht die einzelnen Teile |

---
## 8. Integration in Unified Spec

Diese Erweiterung wird als neues Kapitel in die UNIFIED-SYSTEM-SPEC eingefügt:
- **Neuer Abschnitt III.5**: NumDSL Syntax-Referenz (nach Unified Store)
- **Abschnitt VIII überarbeiten**: Zwei-Tier → Drei-Tier (Tier 0 explizit)
- **Abschnitt XI überarbeiten**: Operatoren mit Tier-Zuordnung und algorithmischem Vorarbeit-Anteil
- **Neue Design-Prinzipien**:
  - P14: Denken in Sprache, Sprechen in DSL, Erklären in Menschlich.
  - P15: Was ein Algorithmus lösen kann, darf kein LLM kosten.

---
*Dieses Dokument wird als Architektur-Erweiterung im Repo unter /docs/ gespeichert.*
*Integration in die Hauptspec erfolgt in einer eigenen Session (Kern-Modus K6).*
