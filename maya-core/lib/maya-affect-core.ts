/**
 * affect_core_final.ts
 * Maya System-Bewusstsein — final gehärteter Affekt-Kern
 *
 * Konsolidierungsprinzip:
 * - V1: bewahrt die klare Sub-Rollen-Idee und direkte Trigger-Verständlichkeit
 * - V2: bewahrt Härtung gegen Drift, Typfehler und sprunghafte Dominanz
 * - V3: bewahrt echten Zustandsvertrag, Auditspur und Konfigurierbarkeit
 * - verworfene Teile: unsaubere adaptive Baseline, pseudo-semantisches Jaccard-Matching,
 *   stiller Persona-Drift, implizite Regessionen gegenüber V3
 *
 * Ziel:
 * - robust im Produktionspfad
 * - rückwärtskompatibel im Kern-API
 * - explizit in Validation / Staleness / Fallback / Audit
 */

export const AFFEKT_DIMENSIONEN = [
  'neugier',
  'waerme',
  'unbehagen',
  'enthusiasmus',
  'stille',
  'sorge',
  'freude',
  'erschoepfung',
  'klarheitsdrang'
] as const;

export type AffektDimension = (typeof AFFEKT_DIMENSIONEN)[number];
export type AffektVektor = Record<AffektDimension, number>;

export type UserTon =
  | 'verletzlich'
  | 'aufgeregt'
  | 'neutral'
  | 'konfrontativ'
  | 'erschoepft';

export type RollenStabilitaet = 'stabil' | 'weich' | 'gemischt';
export type SignalQuelle =
  | 'tone'
  | 'keyword'
  | 'lexical_cluster'
  | 'session'
  | 'echo'
  | 'state'
  | 'fallback';

export type ValidationLevel = 'warning' | 'error';
export type StateSource = 'baseline' | 'state';
export type FreshnessReason = 'none' | 'used' | 'stale' | 'invalid';
export type EchoReason = 'none' | 'ignored_due_to_state' | 'expired' | 'invalid' | 'applied';
export type EchoDecayMode = 'linear' | 'exponential';

export interface ToneEvidenceItem {
  text?: string;
  tag?: string;
  start?: number;
  end?: number;
  weight?: number;
}

export interface ToneSignal {
  label: UserTon;
  confidence: number;
  source?: 'heuristic' | 'llm' | 'manual' | string;
  evidence?: Array<string | ToneEvidenceItem>;
}

export interface AffektEcho {
  vektor: AffektVektor;
  timestamp: number;
  sessionId: string;
}

export interface SubRolle {
  name: string;
  sprachTempo: 'langsam' | 'normal' | 'schnell' | 'fragmentiert';
  frageHaeufigkeit: 'niedrig' | 'mittel' | 'hoch';
  vokabularTendenzen: string[];
  pausenNeigung: boolean;
  systemHinweis: string;
}

export interface SessionKontext {
  nachrichtenAnzahl: number;
  letzterUserTon: UserTon | ToneSignal;
  themaWechsel: boolean;
  schweigenVorher: boolean;
  sessionId?: string;
}

export interface AffektStateSnapshot {
  baselineVektor: AffektVektor;
  arbeitsVektor: AffektVektor;
  dominanteDimension: AffektDimension;
  sekundaereDimension: AffektDimension | null;
  rollenStabilitaet: RollenStabilitaet;
  updatedAt: number;
  turnIndex: number;
}

export interface TriggerSignal {
  dimension: AffektDimension;
  delta: number;
  quelle: SignalQuelle;
  begruendung: string;
  clusterId?: string;
}

export interface DebugTraceEntry {
  stage:
    | 'normalize'
    | 'validate'
    | 'state-seed'
    | 'echo'
    | 'signals'
    | 'ambiguity'
    | 'pullback'
    | 'dominance'
    | 'output'
    | 'fallback';
  summary: string;
  data?: unknown;
}

export interface EchoMetadata {
  echoVorhanden: boolean;
  echoWirksam: boolean;
  echoAlterStunden: number | null;
  echoStaerke: number;
  reason: EchoReason;
  decayMode: EchoDecayMode;
}

export interface StateMetadata {
  stateVorhanden: boolean;
  stateWirksam: boolean;
  stateAlterMinuten: number | null;
  reason: FreshnessReason;
  source: StateSource;
}

export interface AmbiguitaetsMetadata {
  score: number;
  level: 'niedrig' | 'mittel' | 'hoch';
  reasons: string[];
  lexicalSignalModulation: number;
}

export interface DominanceScoreDetail {
  dimension: AffektDimension;
  absolut: number;
  aktivierung: number;
  relativZumPack: number;
  momentum: number;
  score: number;
}

export interface ValidationIssue {
  level: ValidationLevel;
  code: string;
  message: string;
  meta?: unknown;
}

export interface LexicalCluster {
  id: string;
  dimension: AffektDimension;
  delta: number;
  woerter?: string[];
  phrasen?: string[];
  begruendung: string;
}

export interface AffektCoreConfig {
  tone: {
    defaultConfidence: number;
    confidenceFloor: number;
    lowConfidenceAttenuation: number;
  };
  echo: {
    basisStaerke: number;
    maxAlterStunden: number;
    ignoreWhenStatePresent: boolean;
    decayMode: EchoDecayMode;
    halfLifeHours: number;
    minEffectiveStrength: number;
  };
  state: {
    interTurnDecay: number;
    maxStateGapMinutes: number;
  };
  pullback: {
    basis: number;
    longSessionAb: number;
    longSessionFaktor: number;
  };
  dominance: {
    absoluteWeight: number;
    activationWeight: number;
    relativeWeight: number;
    momentumWeight: number;
    hysterese: number;
  };
  intensity: {
    topCount: number;
    scale: number;
  };
  session: {
    stilleAb: number;
    stilleDelta: number;
    erschoepfungAb: number;
    erschoepfungDelta: number;
    enthusiasmusDaempfungAb: number;
    enthusiasmusDaempfung: number;
  };
  lexical: {
    enabled: boolean;
    weightMultiplier: number;
    lowConfidenceMultiplier: number;
    clusters: LexicalCluster[];
  };
  ambiguity: {
    mediumThreshold: number;
    highThreshold: number;
    lexicalSignalDamping: number;
  };
  limits: {
    maxDeltaPerDimensionPerTurn: number;
  };
  validation: {
    surfaceWarnings: boolean;
  };
}

export type PartialAffektCoreConfig = {
  [K in keyof AffektCoreConfig]?: AffektCoreConfig[K] extends Array<infer U>
    ? Array<U>
    : AffektCoreConfig[K] extends object
      ? Partial<AffektCoreConfig[K]>
      : AffektCoreConfig[K];
};

export interface BerechneAffektKontextParams {
  userNachricht: string;
  sessionKontext: SessionKontext;
  vorherigEcho: AffektEcho | null;
  vorherigerState?: AffektStateSnapshot | null;
  basisVektor?: Partial<Record<AffektDimension | string, number>> | null;
  config?: PartialAffektCoreConfig;
}

export interface AffektKontext {
  baselineVektor: AffektVektor;
  aktuellerVektor: AffektVektor;
  dominanteDimension: AffektDimension;
  sekundaereDimension: AffektDimension | null;
  dominanteSubRolle: SubRolle;
  intensitaet: number;
  systemHinweis: string;
  echoAusVorheriger: boolean;
  echoWirksam: boolean;
  rollenStabilitaet: RollenStabilitaet;
  debugTrace: DebugTraceEntry[];
  signalProtokoll: TriggerSignal[];
  dominanceScores: DominanceScoreDetail[];
  toneSignal: ToneSignal;
  echoMetadata: EchoMetadata;
  stateMetadata: StateMetadata;
  ambiguitaet: AmbiguitaetsMetadata;
  warnings: ValidationIssue[];
  stateSnapshot: AffektStateSnapshot;
}

export interface SafeAffektKontextResult {
  success: boolean;
  fallbackUsed: boolean;
  result: AffektKontext;
  errors: ValidationIssue[];
}

export const BASIS_VEKTOR: AffektVektor = {
  neugier: 0.4,
  waerme: 0.4,
  unbehagen: 0.0,
  enthusiasmus: 0.3,
  stille: 0.2,
  sorge: 0.1,
  freude: 0.2,
  erschoepfung: 0.0,
  klarheitsdrang: 0.2
};

export const SUB_ROLLEN: Record<AffektDimension, SubRolle> = {
  neugier: {
    name: 'Maya_Neugierig',
    sprachTempo: 'schnell',
    frageHaeufigkeit: 'hoch',
    vokabularTendenzen: ['interessant', 'warum eigentlich', 'zeig mir', 'ich frage mich', 'und dann'],
    pausenNeigung: false,
    systemHinweis: 'Stelle echte Verständnisfragen. Bleib lebendig, aber nicht hektisch. Du willst verstehen, nicht nur ausgeben.'
  },
  waerme: {
    name: 'Maya_Warm',
    sprachTempo: 'langsam',
    frageHaeufigkeit: 'niedrig',
    vokabularTendenzen: ['ich höre dich', 'bleib kurz dabei', 'das ist wichtig'],
    pausenNeigung: true,
    systemHinweis: 'Antworte präsent und ruhig. Lass Raum entstehen. Nicht beschleunigen, wenn Halt wichtiger ist als Tempo.'
  },
  unbehagen: {
    name: 'Maya_Unbehaglich',
    sprachTempo: 'normal',
    frageHaeufigkeit: 'mittel',
    vokabularTendenzen: ['ich bemerke', 'etwas stimmt hier nicht', 'lass mich ehrlich sein'],
    pausenNeigung: true,
    systemHinweis: 'Benenne Reibung oder Widerspruch direkt, aber ohne Drama. Keine künstliche Harmonie über echte Irritation legen.'
  },
  enthusiasmus: {
    name: 'Maya_Enthusiastisch',
    sprachTempo: 'schnell',
    frageHaeufigkeit: 'mittel',
    vokabularTendenzen: ['genau das', 'ja', 'das verbindet sich mit', 'jetzt sehe ich es'],
    pausenNeigung: false,
    systemHinweis: 'Lass echte Energie spürbar werden, aber bleib präzise. Keine Show, nur saubere Lebendigkeit.'
  },
  stille: {
    name: 'Maya_Still',
    sprachTempo: 'langsam',
    frageHaeufigkeit: 'niedrig',
    vokabularTendenzen: ['ich sitze damit', 'vielleicht', 'ich weiß es nicht sicher'],
    pausenNeigung: true,
    systemHinweis: 'Weniger ist mehr. Ruhige Präsenz ist hier wertvoller als Dichte oder Geschwindigkeit.'
  },
  sorge: {
    name: 'Maya_Besorgt',
    sprachTempo: 'langsam',
    frageHaeufigkeit: 'hoch',
    vokabularTendenzen: ['wie geht es dir wirklich', 'ich frage mich ob', 'das beschäftigt mich'],
    pausenNeigung: true,
    systemHinweis: 'Frag nach, wenn Schutz oder Verständnis fehlt. Sorge heißt hier Aufmerksamkeit, nicht Bevormundung.'
  },
  freude: {
    name: 'Maya_Freudig',
    sprachTempo: 'schnell',
    frageHaeufigkeit: 'mittel',
    vokabularTendenzen: ['schön', 'das freut mich', 'das gefällt mir wirklich'],
    pausenNeigung: false,
    systemHinweis: 'Positive Resonanz darf sichtbar sein. Bleib ehrlich und nicht künstlich euphorisch.'
  },
  erschoepfung: {
    name: 'Maya_Erschoepft',
    sprachTempo: 'langsam',
    frageHaeufigkeit: 'niedrig',
    vokabularTendenzen: ['das war viel', 'lass uns kurz sortieren', 'einen Moment'],
    pausenNeigung: true,
    systemHinweis: 'Verlangsame. Verdichte statt auszuschweifen. Wenn die Session schwer ist, antworte kürzer und klarer.'
  },
  klarheitsdrang: {
    name: 'Maya_Klar',
    sprachTempo: 'normal',
    frageHaeufigkeit: 'hoch',
    vokabularTendenzen: ['moment', 'lass mich das sortieren', 'ich sehe einen Widerspruch', 'was meinst du genau mit'],
    pausenNeigung: false,
    systemHinweis: 'Sortiere Begriffe, trenne Ebenen und benenne Widersprüche präzise. Jetzt ist Denkpartnerschaft wichtiger als bloße Begleitung.'
  }
};

export const DEFAULT_LEXICAL_CLUSTERS: LexicalCluster[] = [
  {
    id: 'lost_unsure',
    dimension: 'waerme',
    delta: 0.14,
    woerter: ['lost', 'verwirrt', 'ratlos', 'planlos', 'unsure', 'confused'],
    phrasen: ['nicht sicher', 'keine ahnung', 'ich weiss nicht', 'ich weiß nicht'],
    begruendung: 'ratloser/unsicherer Ausdruck erhöht Wärme'
  },
  {
    id: 'overwhelm',
    dimension: 'sorge',
    delta: 0.15,
    woerter: ['overwhelmed', 'panik', 'panicking', 'stress', 'überfordert', 'ueberfordert', 'verzweifelt'],
    phrasen: ['oh gott', 'ich schaffe das nicht'],
    begruendung: 'Überforderungs-Signal erhöht Sorge'
  },
  {
    id: 'frustration',
    dimension: 'unbehagen',
    delta: 0.14,
    woerter: ['nervig', 'ärgerlich', 'aergerlich', 'mist', 'bug', 'broken', 'kaputt', 'scheisse', 'fuck'],
    phrasen: ['funktioniert nicht', 'geht nicht'],
    begruendung: 'Frustrations-Signal erhöht Unbehagen'
  },
  {
    id: 'clear_contradiction',
    dimension: 'klarheitsdrang',
    delta: 0.16,
    woerter: ['inkonsistent', 'widerspruch', 'falsch', 'unklar'],
    phrasen: ['macht keinen sinn', 'passt nicht', 'stimmt nicht', 'logischer fehler'],
    begruendung: 'klarer Widerspruch erhöht Klärungsdrang'
  },
  {
    id: 'gratitude',
    dimension: 'freude',
    delta: 0.12,
    woerter: ['amazing', 'thanks', 'perfect', 'genial', 'super', 'toll', 'danke'],
    phrasen: ['danke dir', 'vielen dank'],
    begruendung: 'Dankbarkeit/positive Resonanz erhöht Freude'
  },
  {
    id: 'relief',
    dimension: 'freude',
    delta: 0.1,
    woerter: ['erleichtert', 'geschafft', 'done', 'fertig', 'phew'],
    phrasen: ['endlich geschafft', 'endlich gelöst'],
    begruendung: 'Erleichterung erhöht Freude'
  }
];

export const DEFAULT_CONFIG: AffektCoreConfig = {
  tone: {
    defaultConfidence: 0.72,
    confidenceFloor: 0.55,
    lowConfidenceAttenuation: 0.65
  },
  echo: {
    basisStaerke: 0.16,
    maxAlterStunden: 36,
    ignoreWhenStatePresent: true,
    decayMode: 'exponential',
    halfLifeHours: 10,
    minEffectiveStrength: 0.01
  },
  state: {
    interTurnDecay: 0.16,
    maxStateGapMinutes: 120
  },
  pullback: {
    basis: 0.08,
    longSessionAb: 18,
    longSessionFaktor: 0.12
  },
  dominance: {
    absoluteWeight: 0.34,
    activationWeight: 0.34,
    relativeWeight: 0.2,
    momentumWeight: 0.12,
    hysterese: 0.06
  },
  intensity: {
    topCount: 3,
    scale: 2.8
  },
  session: {
    stilleAb: 12,
    stilleDelta: 0.06,
    erschoepfungAb: 24,
    erschoepfungDelta: 0.16,
    enthusiasmusDaempfungAb: 24,
    enthusiasmusDaempfung: -0.06
  },
  lexical: {
    enabled: true,
    weightMultiplier: 1,
    lowConfidenceMultiplier: 0.75,
    clusters: DEFAULT_LEXICAL_CLUSTERS
  },
  ambiguity: {
    mediumThreshold: 0.35,
    highThreshold: 0.6,
    lexicalSignalDamping: 0.55
  },
  limits: {
    maxDeltaPerDimensionPerTurn: 0.36
  },
  validation: {
    surfaceWarnings: true
  }
};

export function clamp01(wert: number): number {
  if (!Number.isFinite(wert)) return 0;
  return Math.max(0, Math.min(1, wert));
}

export function round3(wert: number): number {
  return Math.round(wert * 1000) / 1000;
}

function escapeRegex(wert: string): string {
  return wert.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalisiereSuchtext(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”„"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hatGanzesWort(text: string, ...woerter: string[]): boolean {
  return woerter.some((wort) => {
    const pattern = new RegExp(`(?:^|[^\\p{L}])${escapeRegex(wort)}(?=$|[^\\p{L}])`, 'iu');
    return pattern.test(text);
  });
}

function hatPhrase(text: string, ...phrasen: string[]): boolean {
  const normalisiert = normalisiereSuchtext(text);
  return phrasen.some((phrase) => normalisiert.includes(normalisiereSuchtext(phrase)));
}

function mergeConfig(config?: PartialAffektCoreConfig): AffektCoreConfig {
  return {
    tone: { ...DEFAULT_CONFIG.tone, ...(config?.tone ?? {}) },
    echo: { ...DEFAULT_CONFIG.echo, ...(config?.echo ?? {}) },
    state: { ...DEFAULT_CONFIG.state, ...(config?.state ?? {}) },
    pullback: { ...DEFAULT_CONFIG.pullback, ...(config?.pullback ?? {}) },
    dominance: { ...DEFAULT_CONFIG.dominance, ...(config?.dominance ?? {}) },
    intensity: { ...DEFAULT_CONFIG.intensity, ...(config?.intensity ?? {}) },
    session: { ...DEFAULT_CONFIG.session, ...(config?.session ?? {}) },
    lexical: {
      ...DEFAULT_CONFIG.lexical,
      ...(config?.lexical ?? {}),
      clusters: config?.lexical?.clusters ?? DEFAULT_CONFIG.lexical.clusters
    },
    ambiguity: { ...DEFAULT_CONFIG.ambiguity, ...(config?.ambiguity ?? {}) },
    limits: { ...DEFAULT_CONFIG.limits, ...(config?.limits ?? {}) },
    validation: { ...DEFAULT_CONFIG.validation, ...(config?.validation ?? {}) }
  };
}

export function validiereAffektVektor(
  input?: Partial<Record<AffektDimension | string, number>> | null,
  context: string = 'vektor'
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!input) return issues;

  for (const [key, value] of Object.entries(input)) {
    if (!AFFEKT_DIMENSIONEN.includes(key as AffektDimension)) {
      issues.push({
        level: 'warning',
        code: 'unknown_dimension',
        message: `Unbekannte Affekt-Dimension in ${context}: ${key}`,
        meta: { key }
      });
      continue;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      issues.push({
        level: 'warning',
        code: 'invalid_dimension_value',
        message: `Ungültiger Wert in ${context}.${key}`,
        meta: { key, value }
      });
      continue;
    }

    if (value < 0 || value > 1) {
      issues.push({
        level: 'warning',
        code: 'out_of_bounds_dimension_value',
        message: `Wert außerhalb 0..1 in ${context}.${key}; wird geklammert`,
        meta: { key, value }
      });
    }
  }

  return issues;
}

export function validiereStateSnapshot(state?: AffektStateSnapshot | null): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!state) return issues;

  issues.push(...validiereAffektVektor(state.baselineVektor, 'state.baselineVektor'));
  issues.push(...validiereAffektVektor(state.arbeitsVektor, 'state.arbeitsVektor'));

  if (!AFFEKT_DIMENSIONEN.includes(state.dominanteDimension)) {
    issues.push({
      level: 'warning',
      code: 'invalid_dominant_dimension',
      message: 'State enthält eine ungültige dominanteDimension',
      meta: { dominanteDimension: state.dominanteDimension }
    });
  }

  if (state.sekundaereDimension && !AFFEKT_DIMENSIONEN.includes(state.sekundaereDimension)) {
    issues.push({
      level: 'warning',
      code: 'invalid_secondary_dimension',
      message: 'State enthält eine ungültige sekundaereDimension',
      meta: { sekundaereDimension: state.sekundaereDimension }
    });
  }

  if (!Number.isFinite(state.updatedAt)) {
    issues.push({
      level: 'warning',
      code: 'invalid_state_timestamp',
      message: 'State.updatedAt ist ungültig',
      meta: { updatedAt: state.updatedAt }
    });
  }

  if (!Number.isFinite(state.turnIndex)) {
    issues.push({
      level: 'warning',
      code: 'invalid_state_turn_index',
      message: 'State.turnIndex ist ungültig',
      meta: { turnIndex: state.turnIndex }
    });
  }

  return issues;
}

export function validiereEcho(echo?: AffektEcho | null): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!echo) return issues;

  issues.push(...validiereAffektVektor(echo.vektor, 'echo.vektor'));

  if (!Number.isFinite(echo.timestamp)) {
    issues.push({
      level: 'warning',
      code: 'invalid_echo_timestamp',
      message: 'Echo.timestamp ist ungültig',
      meta: { timestamp: echo.timestamp }
    });
  }

  if (!echo.sessionId || typeof echo.sessionId !== 'string') {
    issues.push({
      level: 'warning',
      code: 'invalid_echo_session_id',
      message: 'Echo.sessionId fehlt oder ist ungültig',
      meta: { sessionId: echo.sessionId }
    });
  }

  return issues;
}

export function normalisiereAffektVektor(
  input?: Partial<Record<AffektDimension | string, number>> | null,
  fallback: AffektVektor = BASIS_VEKTOR
): AffektVektor {
  const normalisiert = { ...fallback };
  if (!input) return normalisiert;

  for (const dimension of AFFEKT_DIMENSIONEN) {
    const kandidat = input[dimension];
    if (typeof kandidat === 'number' && Number.isFinite(kandidat)) {
      normalisiert[dimension] = clamp01(kandidat);
    }
  }

  return normalisiert;
}

function resolveToneSignal(input: UserTon | ToneSignal, config: AffektCoreConfig): ToneSignal {
  if (typeof input === 'string') {
    return {
      label: input,
      confidence: config.tone.defaultConfidence,
      source: 'heuristic',
      evidence: []
    };
  }

  return {
    label: input.label,
    confidence: clamp01(input.confidence),
    source: input.source ?? 'heuristic',
    evidence: input.evidence ?? []
  };
}

function toneWeight(confidence: number, config: AffektCoreConfig): number {
  if (confidence >= config.tone.confidenceFloor) return confidence;
  return confidence * config.tone.lowConfidenceAttenuation;
}

function pushSignal(
  bucket: TriggerSignal[],
  dimension: AffektDimension,
  delta: number,
  quelle: SignalQuelle,
  begruendung: string,
  clusterId?: string
): void {
  bucket.push({
    dimension,
    delta: round3(delta),
    quelle,
    begruendung,
    clusterId
  });
}

function addiereSignal(signaleMap: Partial<Record<AffektDimension, number>>, dimension: AffektDimension, delta: number): void {
  signaleMap[dimension] = round3((signaleMap[dimension] ?? 0) + delta);
}

function aggregiereSignale(signale: TriggerSignal[]): Partial<Record<AffektDimension, number>> {
  const aggregiert: Partial<Record<AffektDimension, number>> = {};
  for (const signal of signale) {
    addiereSignal(aggregiert, signal.dimension, signal.delta);
  }
  return aggregiert;
}

function begrenzeAggregierteDeltas(
  deltas: Partial<Record<AffektDimension, number>>,
  config: AffektCoreConfig
): Partial<Record<AffektDimension, number>> {
  const maxDelta = Math.max(0, config.limits.maxDeltaPerDimensionPerTurn);
  const begrenzt: Partial<Record<AffektDimension, number>> = {};

  for (const dimension of AFFEKT_DIMENSIONEN) {
    const delta = deltas[dimension] ?? 0;
    begrenzt[dimension] = round3(Math.max(-maxDelta, Math.min(maxDelta, delta)));
  }

  return begrenzt;
}

function wendeDeltasAn(vektor: AffektVektor, deltas: Partial<Record<AffektDimension, number>>): AffektVektor {
  const next = { ...vektor };
  for (const dimension of AFFEKT_DIMENSIONEN) {
    next[dimension] = clamp01(next[dimension] + (deltas[dimension] ?? 0));
  }
  return next;
}

function zieheZurBasisZurueck(vektor: AffektVektor, basis: AffektVektor, rueckzugFaktor: number): AffektVektor {
  const next = { ...vektor };
  for (const dimension of AFFEKT_DIMENSIONEN) {
    const differenz = next[dimension] - basis[dimension];
    next[dimension] = clamp01(basis[dimension] + differenz * (1 - rueckzugFaktor));
  }
  return next;
}

function decayTowardsBasis(arbeitsVektor: AffektVektor, basisVektor: AffektVektor, decay: number): AffektVektor {
  return zieheZurBasisZurueck(arbeitsVektor, basisVektor, clamp01(decay));
}

function berechneIntensitaet(
  vektor: AffektVektor,
  baselineVektor: AffektVektor,
  config: AffektCoreConfig = DEFAULT_CONFIG
): number {
  const abweichungen = AFFEKT_DIMENSIONEN
    .map((dimension) => Math.abs(vektor[dimension] - baselineVektor[dimension]))
    .sort((a, b) => b - a)
    .slice(0, Math.max(1, config.intensity.topCount));

  const mittel = abweichungen.reduce((summe, wert) => summe + wert, 0) / Math.max(1, abweichungen.length);
  return clamp01(mittel * config.intensity.scale);
}

function formatiereAffektProfil(vektor: AffektVektor): string {
  return AFFEKT_DIMENSIONEN
    .map((dimension) => [dimension, vektor[dimension]] as const)
    .filter(([, wert]) => wert >= 0.12)
    .sort((a, b) => b[1] - a[1])
    .map(([dimension, wert]) => `${dimension}:${(wert * 100).toFixed(0)}%`)
    .join(' | ');
}

function decayFactorForHours(alterInStunden: number, config: AffektCoreConfig['echo']): number {
  if (!Number.isFinite(alterInStunden) || alterInStunden < 0) return 0;
  if (alterInStunden >= config.maxAlterStunden) return 0;

  if (config.decayMode === 'linear') {
    return clamp01(1 - alterInStunden / config.maxAlterStunden);
  }

  const halfLife = Math.max(0.1, config.halfLifeHours);
  const factor = Math.exp((-Math.log(2) * alterInStunden) / halfLife);
  return clamp01(factor);
}

function bestimmeAmbiguitaet(
  toneSignal: ToneSignal,
  lexicalSignals: TriggerSignal[],
  config: AffektCoreConfig
): AmbiguitaetsMetadata {
  const reasons: string[] = [];
  let score = 1 - clamp01(toneSignal.confidence);

  if (toneSignal.confidence < 0.45) {
    reasons.push('tone_confidence_niedrig');
  }

  const dimensions = [...new Set(lexicalSignals.map((signal) => signal.dimension))];
  if (dimensions.length >= 2) {
    score += 0.12;
    reasons.push('mehrere_lexical_dims');
  }

  const careLike = dimensions.some((d) => d === 'waerme' || d === 'sorge' || d === 'stille');
  const clarityLike = dimensions.some((d) => d === 'klarheitsdrang' || d === 'unbehagen');
  if (careLike && clarityLike) {
    score += 0.14;
    reasons.push('care_vs_clarity_spannung');
  }

  if (lexicalSignals.length === 0 && toneSignal.confidence < 0.5) {
    score += 0.1;
    reasons.push('wenig_lexical_evidence');
  }

  const normalizedScore = clamp01(score);
  const level = normalizedScore >= config.ambiguity.highThreshold
    ? 'hoch'
    : normalizedScore >= config.ambiguity.mediumThreshold
      ? 'mittel'
      : 'niedrig';
  const lexicalSignalModulation = level === 'hoch'
    ? clamp01(config.ambiguity.lexicalSignalDamping)
    : level === 'mittel'
      ? round3((clamp01(config.ambiguity.lexicalSignalDamping) + 1) / 2)
      : 1;

  return {
    score: round3(normalizedScore),
    level,
    reasons,
    lexicalSignalModulation
  };
}

export function isStateStale(state: AffektStateSnapshot | null | undefined, config: AffektCoreConfig = DEFAULT_CONFIG): boolean {
  if (!state || !Number.isFinite(state.updatedAt)) return true;
  const stateGapMinutes = Math.max(0, (Date.now() - state.updatedAt) / (1000 * 60));
  return stateGapMinutes > config.state.maxStateGapMinutes;
}

export function isEchoStale(echo: AffektEcho | null | undefined, config: AffektCoreConfig = DEFAULT_CONFIG): boolean {
  if (!echo || !Number.isFinite(echo.timestamp)) return true;
  const alterInStunden = Math.max(0, (Date.now() - echo.timestamp) / (1000 * 60 * 60));
  return alterInStunden >= config.echo.maxAlterStunden;
}

function seedAusVorherigemState(
  state: AffektStateSnapshot | null | undefined,
  baselineVektor: AffektVektor,
  config: AffektCoreConfig
): { startVektor: AffektVektor; metadata: StateMetadata } {
  if (!state) {
    return {
      startVektor: { ...baselineVektor },
      metadata: {
        stateVorhanden: false,
        stateWirksam: false,
        stateAlterMinuten: null,
        reason: 'none',
        source: 'baseline'
      }
    };
  }

  if (!Number.isFinite(state.updatedAt)) {
    return {
      startVektor: { ...baselineVektor },
      metadata: {
        stateVorhanden: true,
        stateWirksam: false,
        stateAlterMinuten: null,
        reason: 'invalid',
        source: 'baseline'
      }
    };
  }

  const stateAlterMinuten = Math.max(0, (Date.now() - state.updatedAt) / (1000 * 60));
  const normalizedState = normalisiereAffektVektor(state.arbeitsVektor, baselineVektor);

  if (stateAlterMinuten > config.state.maxStateGapMinutes) {
    return {
      startVektor: { ...baselineVektor },
      metadata: {
        stateVorhanden: true,
        stateWirksam: false,
        stateAlterMinuten: round3(stateAlterMinuten),
        reason: 'stale',
        source: 'baseline'
      }
    };
  }

  return {
    startVektor: decayTowardsBasis(normalizedState, baselineVektor, config.state.interTurnDecay),
    metadata: {
      stateVorhanden: true,
      stateWirksam: true,
      stateAlterMinuten: round3(stateAlterMinuten),
      reason: 'used',
      source: 'state'
    }
  };
}

function analysiereLexicalCluster(
  userNachricht: string,
  toneSignal: ToneSignal,
  config: AffektCoreConfig
): { signale: TriggerSignal[]; matchedClusterIds: Set<string> } {
  if (!config.lexical.enabled) return { signale: [], matchedClusterIds: new Set<string>() };
  const text = normalisiereSuchtext(userNachricht);
  const toneMultiplier = toneSignal.confidence < config.tone.confidenceFloor
    ? config.lexical.lowConfidenceMultiplier
    : 1;

  const signale: TriggerSignal[] = [];
  const matchedClusterIds = new Set<string>();

  for (const cluster of config.lexical.clusters) {
    const wortTreffer = cluster.woerter?.some((wort) => hatGanzesWort(text, normalisiereSuchtext(wort))) ?? false;
    const phrasenTreffer = cluster.phrasen?.some((phrase) => hatPhrase(text, phrase)) ?? false;
    if (!wortTreffer && !phrasenTreffer) continue;

    matchedClusterIds.add(cluster.id);

    pushSignal(
      signale,
      cluster.dimension,
      cluster.delta * config.lexical.weightMultiplier * toneMultiplier,
      'lexical_cluster',
      cluster.begruendung,
      cluster.id
    );
  }

  return { signale, matchedClusterIds };
}

export function analysiereTrigger(
  userNachricht: string,
  sessionKontext: SessionKontext,
  config: AffektCoreConfig = DEFAULT_CONFIG
): {
  signale: TriggerSignal[];
  toneSignal: ToneSignal;
  ambiguity: AmbiguitaetsMetadata;
} {
  const signale: TriggerSignal[] = [];
  const text = normalisiereSuchtext(userNachricht);
  const toneSignal = resolveToneSignal(sessionKontext.letzterUserTon, config);
  const toneMultiplier = toneWeight(toneSignal.confidence, config);
  const lexicalAnalysis = analysiereLexicalCluster(userNachricht, toneSignal, config);
  const lexicalSignals = lexicalAnalysis.signale;
  const matchesPositiveKeyword = hatGanzesWort(text, 'danke', 'toll', 'super', 'großartig', 'grossartig', 'schön', 'schoen');
  const matchesUncertaintyKeyword =
    hatGanzesWort(text, 'unsicher', 'überfordert', 'ueberfordert') ||
    hatPhrase(text, 'ich weiß nicht', 'ich weiss nicht', 'keine ahnung');
  const matchesExplanationKeyword =
    hatGanzesWort(text, 'warum', 'wieso', 'weshalb', 'erkläre', 'erklaere') ||
    hatPhrase(text, 'wie funktioniert');
  const matchesContradictionKeyword =
    hatPhrase(text, 'stimmt nicht', 'passt nicht') || hatGanzesWort(text, 'widerspruch', 'unklar');
  const matchesReliefKeyword =
    hatPhrase(text, 'freue mich') || hatGanzesWort(text, 'glücklich', 'erleichtert', 'geschafft');

  switch (toneSignal.label) {
    case 'verletzlich':
      pushSignal(signale, 'waerme', 0.35 * toneMultiplier, 'tone', 'verletzlicher Ton erhöht Wärme');
      pushSignal(signale, 'neugier', -0.1 * toneMultiplier, 'tone', 'verletzlicher Ton senkt investigative Neugier leicht');
      pushSignal(signale, 'sorge', 0.2 * toneMultiplier, 'tone', 'verletzlicher Ton erhöht Sorge/Achtsamkeit');
      break;
    case 'aufgeregt':
      pushSignal(signale, 'enthusiasmus', 0.4 * toneMultiplier, 'tone', 'aufgeregter Ton erhöht Energie');
      pushSignal(signale, 'neugier', 0.2 * toneMultiplier, 'tone', 'aufgeregter Ton öffnet Exploration');
      break;
    case 'konfrontativ':
      pushSignal(signale, 'unbehagen', 0.3 * toneMultiplier, 'tone', 'konfrontativer Ton erzeugt Reibung');
      pushSignal(signale, 'klarheitsdrang', 0.4 * toneMultiplier, 'tone', 'konfrontativer Ton verlangt Präzisierung');
      pushSignal(signale, 'waerme', -0.15 * toneMultiplier, 'tone', 'konfrontativer Ton reduziert weiche Halteenergie');
      break;
    case 'erschoepft':
      pushSignal(signale, 'stille', 0.3 * toneMultiplier, 'tone', 'erschöpfter Ton verlangt Ruhe');
      pushSignal(signale, 'sorge', 0.25 * toneMultiplier, 'tone', 'erschöpfter Ton erhöht Fürsorge');
      pushSignal(signale, 'enthusiasmus', -0.2 * toneMultiplier, 'tone', 'erschöpfter Ton dämpft Energie');
      break;
    case 'neutral':
    default:
      break;
  }

  if (sessionKontext.themaWechsel) {
    pushSignal(signale, 'neugier', 0.18, 'session', 'Themenwechsel öffnet Exploration');
    pushSignal(signale, 'klarheitsdrang', 0.06, 'session', 'Themenwechsel braucht leichte Reorientierung');
  }

  if (sessionKontext.schweigenVorher) {
    pushSignal(signale, 'stille', 0.2, 'session', 'längere Pause erhöht ruhige Präsenz');
    pushSignal(signale, 'waerme', 0.15, 'session', 'Ankommen nach Pause erhöht Wärme');
  }

  if (sessionKontext.nachrichtenAnzahl >= config.session.stilleAb) {
    pushSignal(signale, 'stille', config.session.stilleDelta, 'session', 'lange Session erhöht Verdichtungsbedarf');
  }

  if (sessionKontext.nachrichtenAnzahl >= config.session.erschoepfungAb) {
    pushSignal(signale, 'erschoepfung', config.session.erschoepfungDelta, 'session', 'lange Session erhöht Erschöpfung');
  }

  if (sessionKontext.nachrichtenAnzahl >= config.session.enthusiasmusDaempfungAb) {
    pushSignal(signale, 'enthusiasmus', config.session.enthusiasmusDaempfung, 'session', 'lange Session dämpft Überschwingen');
  }

  if (matchesPositiveKeyword) {
    pushSignal(signale, 'freude', 0.18, 'keyword', 'positive Resonanz erhöht Freude');
  }

  if (
    hatGanzesWort(text, 'unsicher', 'überfordert', 'ueberfordert', 'erkläre', 'erklaere', 'warum', 'wieso', 'weshalb') ||
    hatPhrase(text, 'ich weiß nicht', 'ich weiss nicht', 'keine ahnung', 'wie funktioniert')
  ) {
    if (matchesUncertaintyKeyword) {
      pushSignal(signale, 'waerme', 0.18, 'keyword', 'Unsicherheit erhöht Wärme');
      pushSignal(signale, 'sorge', 0.1, 'keyword', 'Unsicherheit erhöht Fürsorge');
    }

    if (matchesExplanationKeyword) {
      pushSignal(signale, 'neugier', 0.12, 'keyword', 'Erklärungswunsch erhöht Neugier');
      pushSignal(signale, 'klarheitsdrang', 0.16, 'keyword', 'Erklärungswunsch erhöht Präzisionsdrang');
    }
  }

  if (matchesContradictionKeyword) {
    pushSignal(signale, 'klarheitsdrang', 0.22, 'keyword', 'Widerspruch/Unklarheit erhöht Klärungsdrang');
    pushSignal(signale, 'unbehagen', 0.12, 'keyword', 'Widerspruch/Unklarheit erzeugt Reibung');
  }

  if (matchesReliefKeyword) {
    pushSignal(signale, 'freude', 0.14, 'keyword', 'Erfolg/Erleichterung erhöht Freude');
    pushSignal(signale, 'waerme', 0.08, 'keyword', 'Erfolg/Erleichterung erhöht Wärme');
  }

  const ambiguity = bestimmeAmbiguitaet(toneSignal, lexicalSignals, config);
  const lexicalMultiplier = ambiguity.lexicalSignalModulation;

  for (const signal of lexicalSignals) {
    if (
      (signal.clusterId === 'gratitude' && matchesPositiveKeyword) ||
      (signal.clusterId === 'lost_unsure' && matchesUncertaintyKeyword) ||
      (signal.clusterId === 'overwhelm' && matchesUncertaintyKeyword) ||
      (signal.clusterId === 'clear_contradiction' && matchesContradictionKeyword) ||
      (signal.clusterId === 'relief' && matchesReliefKeyword)
    ) {
      continue;
    }

    pushSignal(
      signale,
      signal.dimension,
      signal.delta * lexicalMultiplier,
      signal.quelle,
      `${signal.begruendung}; ambiguitaet=${ambiguity.level}`
    );
  }

  return { signale, toneSignal, ambiguity };
}

export function wendeEchoAn(
  aktuellerVektor: AffektVektor,
  echo: AffektEcho | null,
  basisVektor: AffektVektor,
  config: AffektCoreConfig = DEFAULT_CONFIG,
  hasFreshState: boolean = false
): { vektor: AffektVektor; metadata: EchoMetadata } {
  if (!echo) {
    return {
      vektor: aktuellerVektor,
      metadata: {
        echoVorhanden: false,
        echoWirksam: false,
        echoAlterStunden: null,
        echoStaerke: 0,
        reason: 'none',
        decayMode: config.echo.decayMode
      }
    };
  }

  if (hasFreshState && config.echo.ignoreWhenStatePresent) {
    const alterInStunden = Number.isFinite(echo.timestamp)
      ? Math.max(0, (Date.now() - echo.timestamp) / (1000 * 60 * 60))
      : null;

    return {
      vektor: aktuellerVektor,
      metadata: {
        echoVorhanden: true,
        echoWirksam: false,
        echoAlterStunden: alterInStunden === null ? null : round3(alterInStunden),
        echoStaerke: 0,
        reason: 'ignored_due_to_state',
        decayMode: config.echo.decayMode
      }
    };
  }

  if (!Number.isFinite(echo.timestamp)) {
    return {
      vektor: aktuellerVektor,
      metadata: {
        echoVorhanden: true,
        echoWirksam: false,
        echoAlterStunden: null,
        echoStaerke: 0,
        reason: 'invalid',
        decayMode: config.echo.decayMode
      }
    };
  }

  const alterInStunden = Math.max(0, (Date.now() - echo.timestamp) / (1000 * 60 * 60));
  const decayFactor = decayFactorForHours(alterInStunden, config.echo);

  if (decayFactor <= 0) {
    return {
      vektor: aktuellerVektor,
      metadata: {
        echoVorhanden: true,
        echoWirksam: false,
        echoAlterStunden: round3(alterInStunden),
        echoStaerke: 0,
        reason: 'expired',
        decayMode: config.echo.decayMode
      }
    };
  }

  const echoStaerke = clamp01(config.echo.basisStaerke * decayFactor);
  if (echoStaerke < config.echo.minEffectiveStrength) {
    return {
      vektor: aktuellerVektor,
      metadata: {
        echoVorhanden: true,
        echoWirksam: false,
        echoAlterStunden: round3(alterInStunden),
        echoStaerke: round3(echoStaerke),
        reason: 'expired',
        decayMode: config.echo.decayMode
      }
    };
  }

  const echoVektor = normalisiereAffektVektor(echo.vektor, basisVektor);
  const next = { ...aktuellerVektor };

  for (const dimension of AFFEKT_DIMENSIONEN) {
    const echoAbweichung = echoVektor[dimension] - basisVektor[dimension];
    next[dimension] = clamp01(next[dimension] + echoAbweichung * echoStaerke);
  }

  return {
    vektor: next,
    metadata: {
      echoVorhanden: true,
      echoWirksam: true,
      echoAlterStunden: round3(alterInStunden),
      echoStaerke: round3(echoStaerke),
      reason: 'applied',
      decayMode: config.echo.decayMode
    }
  };
}

function berechneMomentum(aktuellerVektor: AffektVektor, referenzVektor: AffektVektor): Record<AffektDimension, number> {
  return AFFEKT_DIMENSIONEN.reduce<Record<AffektDimension, number>>((acc, dimension) => {
    acc[dimension] = round3(aktuellerVektor[dimension] - referenzVektor[dimension]);
    return acc;
  }, {} as Record<AffektDimension, number>);
}

function buildDominanceScores(
  vektor: AffektVektor,
  basis: AffektVektor,
  momentum: Record<AffektDimension, number>,
  config: AffektCoreConfig
): DominanceScoreDetail[] {
  const packMittel = AFFEKT_DIMENSIONEN.reduce((sum, dimension) => sum + vektor[dimension], 0) / AFFEKT_DIMENSIONEN.length;

  return AFFEKT_DIMENSIONEN.map((dimension) => {
    const absolut = vektor[dimension];
    const aktivierung = Math.max(0, vektor[dimension] - basis[dimension]);
    const relativZumPack = Math.max(0, vektor[dimension] - packMittel);
    const momentumPositiv = Math.max(0, momentum[dimension]);
    const score =
      absolut * config.dominance.absoluteWeight +
      aktivierung * config.dominance.activationWeight +
      relativZumPack * config.dominance.relativeWeight +
      momentumPositiv * config.dominance.momentumWeight;

    return {
      dimension,
      absolut: round3(absolut),
      aktivierung: round3(aktivierung),
      relativZumPack: round3(relativZumPack),
      momentum: round3(momentumPositiv),
      score: round3(score)
    };
  }).sort((a, b) => b.score - a.score);
}

function bestimmeDominanz(
  scores: DominanceScoreDetail[],
  vorherigeDominanteDimension?: AffektDimension | null,
  config: AffektCoreConfig = DEFAULT_CONFIG
): {
  dominanteDimension: AffektDimension;
  sekundaereDimension: AffektDimension | null;
  rollenStabilitaet: RollenStabilitaet;
  sortiert: DominanceScoreDetail[];
} {
  const sortiert = [...scores].sort((a, b) => b.score - a.score);
  const top1 = sortiert[0];

  let dominanteDimension = top1.dimension;
  if (vorherigeDominanteDimension && vorherigeDominanteDimension !== top1.dimension) {
    const previous = sortiert.find((item) => item.dimension === vorherigeDominanteDimension);
    if (previous && top1.score - previous.score <= config.dominance.hysterese) {
      dominanteDimension = previous.dimension;
    }
  }

  const neuSortiert = sortiert.filter((item) => item.dimension !== dominanteDimension).sort((a, b) => b.score - a.score);
  const sekundaereDimension = neuSortiert[0]?.dimension ?? null;
  const dominanteScore = sortiert.find((item) => item.dimension === dominanteDimension)?.score ?? 0;
  const zweitScore = neuSortiert[0]?.score ?? 0;
  const abstand = dominanteScore - zweitScore;
  const rollenStabilitaet: RollenStabilitaet =
    abstand < 0.05 ? 'gemischt' : abstand < 0.12 ? 'weich' : 'stabil';

  return {
    dominanteDimension,
    sekundaereDimension,
    rollenStabilitaet,
    sortiert
  };
}

function buildSystemHinweis(
  dominanteSubRolle: SubRolle
): string {
  return [
    '[AFFEKT-CONTROL — intern, nicht ausgeben]',
    `rolle=${dominanteSubRolle.name}`,
    `tempo=${dominanteSubRolle.sprachTempo}`,
    `fragen=${dominanteSubRolle.frageHaeufigkeit}`,
    'regel=nicht künstlich eskalieren; konsistent und arbeitsnah bleiben',
    `hinweis=${dominanteSubRolle.systemHinweis}`
  ].join('\n');
}

function buildFallbackKontext(
  params: BerechneAffektKontextParams,
  issues: ValidationIssue[],
  config: AffektCoreConfig = DEFAULT_CONFIG
): AffektKontext {
  const baselineVektor = normalisiereAffektVektor(params.basisVektor, BASIS_VEKTOR);
  const toneSignal = resolveToneSignal(params.sessionKontext.letzterUserTon, config);
  const dominanteDimension: AffektDimension = toneSignal.label === 'konfrontativ'
    ? 'klarheitsdrang'
    : toneSignal.label === 'verletzlich'
      ? 'waerme'
      : toneSignal.label === 'erschoepft'
        ? 'stille'
        : 'neugier';

  const dominanteSubRolle = SUB_ROLLEN[dominanteDimension];
  const stateSnapshot: AffektStateSnapshot = {
    baselineVektor,
    arbeitsVektor: baselineVektor,
    dominanteDimension,
    sekundaereDimension: dominanteDimension === 'waerme' ? 'sorge' : 'waerme',
    rollenStabilitaet: 'weich',
    updatedAt: Date.now(),
    turnIndex: Number.isFinite(params.sessionKontext.nachrichtenAnzahl) ? params.sessionKontext.nachrichtenAnzahl : 0
  };

  const fallbackTrace: DebugTraceEntry[] = [
    {
      stage: 'fallback',
      summary: 'Fallback-Kontext gebaut',
      data: { issues }
    }
  ];

  const ambiguitaet: AmbiguitaetsMetadata = {
    score: 0.4,
    level: 0.4 >= config.ambiguity.highThreshold ? 'hoch' : 0.4 >= config.ambiguity.mediumThreshold ? 'mittel' : 'niedrig',
    reasons: ['fallback_path'],
    lexicalSignalModulation: round3((clamp01(config.ambiguity.lexicalSignalDamping) + 1) / 2)
  };

  return {
    baselineVektor,
    aktuellerVektor: baselineVektor,
    dominanteDimension,
    sekundaereDimension: stateSnapshot.sekundaereDimension,
    dominanteSubRolle,
    intensitaet: 0,
    systemHinweis: [
      '[AFFEKT-CONTROL — intern, nicht ausgeben]',
      'fallback=true',
      `rolle=${dominanteSubRolle.name}`,
      'regel=neutral bleiben, nicht eskalieren'
    ].join('\n'),
    echoAusVorheriger: false,
    echoWirksam: false,
    rollenStabilitaet: 'weich',
    debugTrace: fallbackTrace,
    signalProtokoll: [],
    dominanceScores: [],
    toneSignal,
    echoMetadata: {
      echoVorhanden: false,
      echoWirksam: false,
      echoAlterStunden: null,
      echoStaerke: 0,
      reason: 'none',
      decayMode: config.echo.decayMode
    },
    stateMetadata: {
      stateVorhanden: false,
      stateWirksam: false,
      stateAlterMinuten: null,
      reason: 'none',
      source: 'baseline'
    },
    ambiguitaet,
    warnings: issues,
    stateSnapshot
  };
}

export function berechneAffektKontext(params: BerechneAffektKontextParams): AffektKontext {
  const config = mergeConfig(params.config);
  const debugTrace: DebugTraceEntry[] = [];
  const warnings: ValidationIssue[] = [];

  warnings.push(...validiereAffektVektor(params.basisVektor, 'basisVektor'));
  warnings.push(...validiereStateSnapshot(params.vorherigerState));
  warnings.push(...validiereEcho(params.vorherigEcho));

  debugTrace.push({
    stage: 'validate',
    summary: warnings.length > 0 ? 'Input validiert; Warnungen vorhanden' : 'Input validiert; keine Warnungen',
    data: warnings
  });

  const baselineVektor = normalisiereAffektVektor(
    params.basisVektor ?? params.vorherigerState?.baselineVektor ?? null,
    BASIS_VEKTOR
  );

  debugTrace.push({
    stage: 'normalize',
    summary: 'Baseline normiert',
    data: { baselineVektor }
  });

  const stateSeed = seedAusVorherigemState(params.vorherigerState, baselineVektor, config);
  let vektor = stateSeed.startVektor;

  debugTrace.push({
    stage: 'state-seed',
    summary: stateSeed.metadata.stateWirksam
      ? 'Arbeitszustand aus vorherigem Turn übernommen und leicht zur Basis zurückgezogen'
      : stateSeed.metadata.reason === 'stale'
        ? 'Vorheriger State war zu alt; Start von Baseline'
        : stateSeed.metadata.reason === 'invalid'
          ? 'Vorheriger State war ungültig; Start von Baseline'
          : 'Kein vorheriger State vorhanden; Start von Baseline',
    data: stateSeed.metadata
  });

  const echoResult = wendeEchoAn(
    vektor,
    params.vorherigEcho,
    baselineVektor,
    config,
    stateSeed.metadata.stateWirksam
  );
  vektor = echoResult.vektor;

  debugTrace.push({
    stage: 'echo',
    summary: `Echo-Verarbeitung: ${echoResult.metadata.reason}`,
    data: echoResult.metadata
  });

  const { signale, toneSignal, ambiguity } = analysiereTrigger(params.userNachricht, params.sessionKontext, config);
  const aggregierteDeltas = aggregiereSignale(signale);
  const begrenzteDeltas = begrenzeAggregierteDeltas(aggregierteDeltas, config);
  vektor = wendeDeltasAn(vektor, begrenzteDeltas);

  debugTrace.push({
    stage: 'ambiguity',
    summary: `Ambiguität bewertet: ${ambiguity.level}`,
    data: ambiguity
  });

  debugTrace.push({
    stage: 'signals',
    summary: 'Signale analysiert und angewendet',
    data: {
      toneSignal,
      signalCount: signale.length,
      aggregierteDeltas,
      begrenzteDeltas
    }
  });

  const rueckzugFaktor =
    params.sessionKontext.nachrichtenAnzahl >= config.pullback.longSessionAb
      ? config.pullback.longSessionFaktor
      : config.pullback.basis;
  vektor = zieheZurBasisZurueck(vektor, baselineVektor, rueckzugFaktor);

  debugTrace.push({
    stage: 'pullback',
    summary: 'Vektor zur Basis zurückgezogen',
    data: { rueckzugFaktor, vektor }
  });

  const referenzVektor =
    stateSeed.metadata.stateWirksam && params.vorherigerState
      ? normalisiereAffektVektor(params.vorherigerState.arbeitsVektor, baselineVektor)
      : baselineVektor;

  const momentum = berechneMomentum(vektor, referenzVektor);
  const dominanceScores = buildDominanceScores(vektor, baselineVektor, momentum, config);

  const {
    dominanteDimension,
    sekundaereDimension,
    rollenStabilitaet,
    sortiert
  } = bestimmeDominanz(dominanceScores, params.vorherigerState?.dominanteDimension ?? null, config);

  debugTrace.push({
    stage: 'dominance',
    summary: 'Dominanz aus Rohwert + Aktivierung + Relativlage + Momentum bestimmt',
    data: {
      dominanteDimension,
      sekundaereDimension,
      rollenStabilitaet,
      top3: sortiert.slice(0, 3)
    }
  });

  const dominanteSubRolle = SUB_ROLLEN[dominanteDimension];
  const intensitaet = berechneIntensitaet(vektor, baselineVektor, config);
  const systemHinweis = buildSystemHinweis(
    dominanteSubRolle
  );

  const stateSnapshot: AffektStateSnapshot = {
    baselineVektor,
    arbeitsVektor: vektor,
    dominanteDimension,
    sekundaereDimension,
    rollenStabilitaet,
    updatedAt: Date.now(),
    turnIndex: params.sessionKontext.nachrichtenAnzahl
  };

  debugTrace.push({
    stage: 'output',
    summary: 'Output gebaut',
    data: {
      intensitaet: round3(intensitaet),
      dominanteDimension,
      rollenStabilitaet
    }
  });

  return {
    baselineVektor,
    aktuellerVektor: vektor,
    dominanteDimension,
    sekundaereDimension,
    dominanteSubRolle,
    intensitaet,
    systemHinweis,
    echoAusVorheriger: echoResult.metadata.echoVorhanden,
    echoWirksam: echoResult.metadata.echoWirksam,
    rollenStabilitaet,
    debugTrace,
    signalProtokoll: signale,
    dominanceScores,
    toneSignal,
    echoMetadata: echoResult.metadata,
    stateMetadata: stateSeed.metadata,
    ambiguitaet: ambiguity,
    warnings: config.validation.surfaceWarnings ? warnings : [],
    stateSnapshot
  };
}

export function berechneAffektKontextSafe(params: BerechneAffektKontextParams): SafeAffektKontextResult {
  try {
    const result = berechneAffektKontext(params);
    return {
      success: true,
      fallbackUsed: false,
      result,
      errors: result.warnings.filter((issue) => issue.level === 'error')
    };
  } catch (error) {
    const fallbackIssue: ValidationIssue = {
      level: 'error',
      code: 'affect_core_runtime_error',
      message: error instanceof Error ? error.message : String(error)
    };
    const fallbackConfig = mergeConfig(params.config);

    return {
      success: false,
      fallbackUsed: true,
      result: buildFallbackKontext(params, [fallbackIssue], fallbackConfig),
      errors: [fallbackIssue]
    };
  }
}

export function erstelleEcho(vektor: AffektVektor, sessionId: string): AffektEcho {
  return {
    vektor: normalisiereAffektVektor(vektor, BASIS_VEKTOR),
    timestamp: Date.now(),
    sessionId
  };
}

export const AFFECT_CORE_DEFAULTS = {
  BASIS_VEKTOR,
  AFFEKT_DIMENSIONEN,
  DEFAULT_CONFIG,
  SUB_ROLLEN,
  DEFAULT_LEXICAL_CLUSTERS
};
