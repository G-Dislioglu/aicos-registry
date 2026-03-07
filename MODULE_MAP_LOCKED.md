# MODULE_MAP_LOCKED

Stand: 2026-03-07
Status: Locked reference document
Purpose: Authoritative module map lock for shared architecture language in this repository.

## Map Status

- **Shared Map:** `M01–M17`
- **Decision:** `M01–M17` remain the official shared module reference language.
- **`M00` Status:** external governance preface only
- **Constraint:** `M00` is not part of the locked shared module map unless explicitly promoted later through a documented architecture decision.
- **Not locked by this document:** UI specifications, API specifications, packet definitions, final monorepo package layout, runtime implementation details
- **Allowed interpretation level:** module boundaries, responsibilities, interfaces, presence assessment, and MVP criticality only

## External Governance Preface Only

### `M00` – Governance Kernel Preface Record

- **Module-ID:** `M00`
- **Exact module name:** Governance Kernel
- **Kurzbeschreibung:** Optionaler externer Policy- und Governance-Rahmen für systemweite Regeln.
- **Verantwortlichkeiten:** proposal-only policy, proof-gates, anti-loop policy, premium-escalation policy, change-policy
- **Nicht-Zuständigkeiten:** kein offizieller Teil der Shared Map, keine UI, keine Provider-Matrix, keine Registry-Inhalte, keine direkte Runtime-Implementierung als Pflichtmodul
- **Inputs:** Governance-Anliegen und systemweite Policy-Fragen
- **Outputs:** dokumentierte Leitplanken und Policy-Vorgaben
- **Abhängigkeiten:** keine formale Abhängigkeit innerhalb der Shared Map
- **Presence status:** conceptually indicated
- **Repo-Belege:** Governance-Inhalte sind derzeit verteilt über `cards/meta/*.json`, `cards/solutions/*.json` und `README.md`; kein dediziertes `M00`-Artefakt vorhanden
- **MVP-Status:** later
- **Status-Hinweis:** external governance preface only, not part of the locked shared map

## Locked Shared Module Catalog

### `M01` – Registry Core

- **Modul-ID:** `M01`
- **Exakter Modulname:** Registry Core
- **Kurzbeschreibung:** Source of Truth für Kartenfamilien und Basis-Wissensobjekte.
- **Verantwortlichkeiten:** JSON-Cards, Card-Basisstruktur, Knowledge Objects für `errors`, `solutions`, `meta`; spätere Erweiterbarkeit für `roles`, `memory`, `blueprints`
- **Nicht-Zuständigkeiten:** Arena-Runtime, UI-State, temporäre Runs, Trace-Speicher
- **Inputs:** validierte oder proposal-only Karten
- **Outputs:** referenzierbare Wissensobjekte
- **Abhängigkeiten:** `M02`, `M03`
- **Presence status:** technically present
- **Repo-Belege:** `cards/errors/`, `cards/solutions/`, `cards/meta/`, `README.md`
- **MVP-Status:** core

### `M02` – Taxonomy & Alias Layer

- **Modul-ID:** `M02`
- **Exakter Modulname:** Taxonomy & Alias Layer
- **Kurzbeschreibung:** Kontrolliertes Vokabular, ID-Auflösung und referenzsichere Linkbasis.
- **Verantwortlichkeiten:** Domains, Tags, Aliases, ID-Normalisierung, Migrationsreferenzen
- **Nicht-Zuständigkeiten:** inhaltliche Card-Logik, Arena-Entscheidungen, UI-State
- **Inputs:** Änderungen an Bezeichnern, Tags und Referenzen
- **Outputs:** kontrolliertes Vokabular und stabile Referenzauflösung
- **Abhängigkeiten:** `M01`, `M03`
- **Presence status:** technically present
- **Repo-Belege:** `taxonomies/domains.json`, `taxonomies/tags.json`, `index/ALIASES.json`, `MIGRATIONS.md`
- **MVP-Status:** core

### `M03` – Validation & Generation

- **Modul-ID:** `M03`
- **Exakter Modulname:** Validation & Generation
- **Kurzbeschreibung:** Prüft Registry-Artefakte und erzeugt abgeleitete Outputs.
- **Verantwortlichkeiten:** Schema-Checks, Taxonomy-Checks, Link-/Consistency-Checks, Generatoren für Index und Human View
- **Nicht-Zuständigkeiten:** produktive Arena-Entscheidung, UI, Modellsteuerung
- **Inputs:** Registry-Artefakte und Referenzdaten
- **Outputs:** validierte Ableitungen und Prüfberichte
- **Abhängigkeiten:** `M01`, `M02`
- **Presence status:** technically present
- **Repo-Belege:** `tools/generate-index.js`, `tools/generate-human-registry.js`, `tools/validate-taxonomy.js`, `index/INDEX.json`, `human/REGISTRY.md`
- **MVP-Status:** core

### `M04` – Query / Search / Browse Layer

- **Modul-ID:** `M04`
- **Exakter Modulname:** Query / Search / Browse Layer
- **Kurzbeschreibung:** Lesende Navigationsschicht für Suche, Filter, Browse und Crossings-Sicht.
- **Verantwortlichkeiten:** Volltextsuche, Tag-Filter, Listenlogik, Card-Resolver, Browse-Projektionen
- **Nicht-Zuständigkeiten:** Scout-Websuche, externe Search-Tools, Runtime-Orchestrierung
- **Inputs:** Registry- und Indexinformationen
- **Outputs:** navigierbare Such- und Resolver-Ergebnisse
- **Abhängigkeiten:** `M01`, `M02`, `M03`
- **Presence status:** conceptually indicated
- **Repo-Belege:** funktionale Basis über `index/INDEX.json`, `index/ALIASES.json` und Card-Linkstrukturen; kein dediziertes Query-Modul vorhanden
- **MVP-Status:** required

### `M05` – Packet Schema Layer

- **Modul-ID:** `M05`
- **Exakter Modulname:** Packet Schema Layer
- **Kurzbeschreibung:** Standardisiert alle Run-Datenpakete der Arena.
- **Verantwortlichkeiten:** technische Schemata für normierte, speicherbare Laufdaten
- **Nicht-Zuständigkeiten:** konkrete Modell-Provider, UI-Logik, Registry-Authoring
- **Inputs:** Arena-bezogene Zustände und Datenbedarfe
- **Outputs:** normierte, referenzierbare Datenpakete
- **Abhängigkeiten:** `M15`, `M16`
- **Presence status:** not present
- **Repo-Belege:** keine dedizierten Packet-Schema-Dateien oder technischen PKT-Artefakte im aktuellen Repo
- **MVP-Status:** required

### `M06` – Scout Layer

- **Modul-ID:** `M06`
- **Exakter Modulname:** Scout Layer
- **Kurzbeschreibung:** Günstige Such- und Perspektivenschicht für erste Hypothesen, Evidenz und Reibung.
- **Verantwortlichkeiten:** Breadth/Structure/Friction/Micro-Critic-Scouting, erste Gegenkritik, frühe Hypothesenbildung
- **Nicht-Zuständigkeiten:** Final Verdict, Memory-Promotion, Apply
- **Inputs:** Fragestellungen, Evidenzkontext und Registry-Kontext
- **Outputs:** frühe Hypothesen, Evidenzhinweise und Reibungssignale
- **Abhängigkeiten:** `M04`, `M05`, `M12`
- **Presence status:** not present
- **Repo-Belege:** keine dedizierten Scout-Implementierungen oder Scout-Artefakte im aktuellen Repo
- **MVP-Status:** required

### `M07` – Observer Kernel

- **Modul-ID:** `M07`
- **Exakter Modulname:** Observer Kernel
- **Kurzbeschreibung:** Deterministischer Bewertungs- und Eskalationskern.
- **Verantwortlichkeiten:** Surprise-, Risiko-, Divergenz-, No-Delta-, Budgetdruck-Bewertung, Threshold-Matrix, Hysterese, Overrides
- **Nicht-Zuständigkeiten:** freie Kreativität, Distillation, UI
- **Inputs:** Bewertungsrelevante Signale und Zustandsindikatoren
- **Outputs:** strukturierte Bewertungen und Eskalationshinweise
- **Abhängigkeiten:** `M05`, `M06`, `M13`, `M16`
- **Presence status:** not present
- **Repo-Belege:** keine dedizierte Observer- oder Threshold-Implementierung im aktuellen Repo
- **MVP-Status:** required

### `M08` – Specialist Role Layer

- **Modul-ID:** `M08`
- **Exakter Modulname:** Specialist Role Layer
- **Kurzbeschreibung:** Triggerbare Spezialrollenfamilie für Expertenchecks in besonderen Run-Zuständen.
- **Verantwortlichkeiten:** rollenbasierte Zusatzprüfungen, Route-Änderungen, Promotion-Blocks, Spezialanalysen
- **Nicht-Zuständigkeiten:** Standard-Scout-Betrieb ohne Trigger, Basis-UI, Registry-Authoring
- **Inputs:** spezialisierungsrelevante Zustände, Kartenkontext und Konflikthinweise
- **Outputs:** rollenbezogene Zusatzprüfungen und Routing-Hinweise
- **Abhängigkeiten:** `M05`, `M07`, `M13`
- **Presence status:** not present
- **Repo-Belege:** keine `role-*` Artefakte oder Specialist-Role-Implementierungen im aktuellen Repo
- **MVP-Status:** later

### `M09` – Distillation & Judge Layer

- **Modul-ID:** `M09`
- **Exakter Modulname:** Distillation & Judge Layer
- **Kurzbeschreibung:** Verdichtet Scout-/Role-Outputs und erzeugt ein hochwertiges Schlussurteil.
- **Verantwortlichkeiten:** Primary Distiller, Verifier Distiller, Final Judge, optional Alternate Judge
- **Nicht-Zuständigkeiten:** direkte Memory-Schreibrechte, UI, Registry-Mutation
- **Inputs:** verdichtungsrelevante Analyseergebnisse und Bewertungszustände
- **Outputs:** verdichtete Urteile und strukturierte Schlussfolgerungen
- **Abhängigkeiten:** `M05`, `M06`, `M07`, `M08`, `M16`
- **Presence status:** not present
- **Repo-Belege:** keine dedizierte Distillation- oder Judge-Implementierung im aktuellen Repo
- **MVP-Status:** later

### `M10` – Memory System

- **Modul-ID:** `M10`
- **Exakter Modulname:** Memory System
- **Kurzbeschreibung:** Verwaltet Arbeits-, Wochen- und Langzeitgedächtnis für Muster, Routen, Benchmarks und Frictions.
- **Verantwortlichkeiten:** `mem-digest`, `mem-pattern`, `mem-friction`, `mem-benchmark`, `mem-route`; run, working, institutional memory
- **Nicht-Zuständigkeiten:** direkte Scout-Writes, spontane UI-Notizen ohne Governance
- **Inputs:** gedächtnisrelevante Muster, Urteile und Vergleichssignale
- **Outputs:** Memory-Kandidaten und Zustandsvorschläge
- **Abhängigkeiten:** `M09`, `M16`, `M17`
- **Presence status:** not present
- **Repo-Belege:** keine `mem-*` Artefakte oder technisches Memory-System im aktuellen Repo
- **MVP-Status:** later

### `M11` – NumDSL Stack

- **Modul-ID:** `M11`
- **Exakter Modulname:** NumDSL Stack
- **Kurzbeschreibung:** Mechanische Systemsprache für präzise Regeln, Trigger, Gates und Scores.
- **Verantwortlichkeiten:** Core Spec, Formula Proposal Engine, Formula Auditor / Proof Bridge, Explanation Decoder
- **Nicht-Zuständigkeiten:** freie philosophische oder narrative Texte, allgemeine UI-Logik
- **Inputs:** formalisierbare Regel- und Bewertungsanforderungen
- **Outputs:** formalisierte Regeln und erklärbare Mechanik-Beschreibungen
- **Abhängigkeiten:** `M07`, `M09`, `M16`
- **Presence status:** conceptually indicated
- **Repo-Belege:** nur konzeptionelle Spuren in Card-Inhalten und Tags wie `theme:numdsl`; kein dedizierter Syntax-/Parser-/Runtime-Stack vorhanden
- **MVP-Status:** later

### `M12` – Shared Evidence Fetcher

- **Modul-ID:** `M12`
- **Exakter Modulname:** Shared Evidence Fetcher
- **Kurzbeschreibung:** Zentrale Web-/Quellenbeschaffung für ein gemeinsames Evidence Pack.
- **Verantwortlichkeiten:** Search/Grounding, Quellenpaket, gemeinsame Evidence-Basis vor Scouts
- **Nicht-Zuständigkeiten:** vierfache Parallelrecherche derselben Basisdaten, Final Verdict, UI
- **Inputs:** evidenzrelevante Anfragen und Beschaffungsbedarf
- **Outputs:** gemeinsamer, referenzierbarer Evidenzkontext
- **Abhängigkeiten:** `M05`, `M13`, `M15`
- **Presence status:** not present
- **Repo-Belege:** keine dedizierten Evidence-Fetcher-Artefakte oder Web-Grounding-Schicht im aktuellen Repo
- **MVP-Status:** required

### `M13` – Model Provider Matrix

- **Modul-ID:** `M13`
- **Exakter Modulname:** Model Provider Matrix
- **Kurzbeschreibung:** Bindet Rollen an Modelle und steuert Kosten, Budgets und adaptive Auswahl.
- **Verantwortlichkeiten:** Modellslots, Provider-Konfiguration, Role Bindings, Kostenpunkte, adaptive Auswahlregeln
- **Nicht-Zuständigkeiten:** Registry-Inhalte selbst, UI-Komponentenlogik
- **Inputs:** Modellbezogene Konfigurationen, Bindings und Budgetvorgaben
- **Outputs:** Modellzuweisungen und Bewertungsgrundlagen
- **Abhängigkeiten:** `M07`, `M12`, `M15`, `M16`
- **Presence status:** conceptually indicated
- **Repo-Belege:** nur konzeptionelle Spuren in Cards zu Provider-Routing und Modellwahl; keine dedizierte technische Matrix im aktuellen Repo
- **MVP-Status:** required

### `M14` – Web UI Shell

- **Modul-ID:** `M14`
- **Exakter Modulname:** Web UI Shell
- **Kurzbeschreibung:** Sichtbare Arbeitsoberfläche für Registry, Arena, Memory, Benchmarks und Audit.
- **Verantwortlichkeiten:** Seitenrahmen, Navigation, UI-Zustände, Visualisierung von API-Antworten
- **Nicht-Zuständigkeiten:** tiefe Runtime-Logik, direkte Modelllogik, Registry-Mutation ohne API
- **Inputs:** anzeigbare Anwendungsdaten und strukturierte Antworten
- **Outputs:** steuerbare Sicht- und Interaktionszustände
- **Abhängigkeiten:** `M04`, `M15`, `M16`
- **Presence status:** not present
- **Repo-Belege:** keine Webapp, kein `apps/web`, keine UI-Artefakte im aktuellen Repo
- **MVP-Status:** required

### `M15` – API / Runtime Layer

- **Modul-ID:** `M15`
- **Exakter Modulname:** API / Runtime Layer
- **Kurzbeschreibung:** Verbindet Registry, Arena, Observer, Models, Memory und UI.
- **Verantwortlichkeiten:** Server-Endpunkte, Runtime-Orchestrierung, Packet-Handling, Storage-Zugriffe
- **Nicht-Zuständigkeiten:** direkte Modelllogik in UI-Komponenten, Registry als Source of Truth ersetzen
- **Inputs:** Anwendungsanfragen, Modulkontexte und strukturierte Verarbeitungsergebnisse
- **Outputs:** koordinierte Zustands- und Verarbeitungsergebnisse
- **Abhängigkeiten:** `M01`, `M04`, `M05`, `M06`, `M07`, `M09`, `M12`, `M13`, `M16`
- **Presence status:** not present
- **Repo-Belege:** keine API-App, keine Runtime-Endpunkte, keine Server-Orchestrierung im aktuellen Repo
- **MVP-Status:** required

### `M16` – Trace / Audit Layer

- **Modul-ID:** `M16`
- **Exakter Modulname:** Trace / Audit Layer
- **Kurzbeschreibung:** Macht Entscheidungen, Modellwahl, Eskalationen und Änderungen nachvollziehbar.
- **Verantwortlichkeiten:** Trace Logs, Delta Reports, Threshold-Versionen, Benchmark-Vergleiche, strukturierte Audit-Sichten
- **Nicht-Zuständigkeiten:** freie Langtexte ohne Struktur, direkte Registry-Mutation
- **Inputs:** nachvollziehbarkeitsrelevante Zustände, Entscheidungen und Konfigurationen
- **Outputs:** strukturierte Nachvollziehbarkeits- und Vergleichsartefakte
- **Abhängigkeiten:** `M05`, `M07`, `M09`, `M13`, `M15`
- **Presence status:** conceptually indicated
- **Repo-Belege:** nur analoge bzw. konzeptionelle Spuren in `MIGRATIONS.md`, Card-Timestamps und Evidence-Feldern; keine dedizierte technische Trace/Audit-Schicht und kein technischer Modulvollzug im heutigen Repo
- **MVP-Status:** required

### `M17` – Curator / Admin Operations

- **Modul-ID:** `M17`
- **Exakter Modulname:** Curator / Admin Operations
- **Kurzbeschreibung:** Kuratierung, Wartung und proposal-only Verwaltungsprozesse.
- **Verantwortlichkeiten:** Weekly Curator Runs, Dedupe, Promotion, Deprecation, Schema-Updates, Threshold-Tuning
- **Nicht-Zuständigkeiten:** ad-hoc User-Exploration, ungesteuerte Direktänderungen im Registry Core
- **Inputs:** kuratierungsrelevante Prüf- und Wartungssignale
- **Outputs:** kuratierte Vorschläge und Wartungsempfehlungen
- **Abhängigkeiten:** `M03`, `M10`, `M16`
- **Presence status:** not present
- **Repo-Belege:** keine dedizierten Curator-/Admin-Ops-Artefakte oder proposal-only Admin-Flows im aktuellen Repo
- **MVP-Status:** later

## Lock Notes

- Dieses Dokument fixiert die gemeinsame Modulsprache und die Modulgrenzen.
- Dieses Dokument legt keine endgültigen UI-Seiten, API-Routen, Packet-Felder oder Package-Strukturen fest.
- Jede spätere Abweichung von `Shared Map = M01–M17` muss als **`PROPOSED CHANGE`** markiert werden.
- Jede spätere Architektur-Ableitung muss dieses Lock-Dokument referenzieren, nicht ersetzen.
