/**
 * maya-local-response.ts
 *
 * Deterministic local response generator for file-mode.
 * Delivers a structured 4-part Maya response without a real AI provider.
 * Same schema as real-provider responses so the UI feels consistent.
 */

export type WorkMode = 'step' | 'risk' | 'assumption' | 'free';

/** Detect the most likely work mode from the user's input text. */
export function detectWorkMode(text: string): WorkMode {
  const t = text.toLowerCase();
  if (/nächst|schritt|plan|priorit|action|todo|aufgabe|umsetzen/.test(t)) return 'step';
  if (/ignorier|risiko|blind|gefahr|problem|fehler|was nicht|übersehen/.test(t)) return 'risk';
  if (/annahme|annehm|voraussetz|prüfen|stimmt|glaub|wirklich/.test(t)) return 'assumption';
  return 'free';
}

export type ResponsePolicy = 'full_work_block' | 'compact_work_block' | 'clarify' | 'light_social';

function normalizeInput(text: string): string {
  return text.trim().toLowerCase();
}

function isLightSocialInput(text: string): boolean {
  const t = normalizeInput(text);
  if (!t) return false;
  return /^(?:(hi|hey|hallo|moin|guten morgen|guten tag|guten abend|na|servus|yo)(?:[,!?.\s]+(wie geht'?s))?|wie geht'?s)[!?.\s]*$/.test(t);
}

function isThinContext(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length < 48) return true;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  return wordCount < 8;
}

function needsClarification(text: string, mode: WorkMode): boolean {
  if (mode === 'free') return false;
  return isThinContext(text);
}

export function classifyResponsePolicy(text: string, mode: WorkMode): ResponsePolicy {
  if (isLightSocialInput(text)) return 'light_social';
  if (needsClarification(text, mode)) return 'clarify';
  if (mode === 'free') {
    return isThinContext(text) ? 'clarify' : 'compact_work_block';
  }
  return isThinContext(text) ? 'compact_work_block' : 'full_work_block';
}

/** System instruction injected into the messages array when a real provider is available. */
const MODE_FOCUS: Record<WorkMode, string> = {
  step: 'Fokus: nächster konkreter Schritt.',
  risk: 'Fokus: Risiken, blinde Flecken und Dinge, die man nicht ignorieren sollte.',
  assumption: 'Fokus: implizite Annahmen sichtbar machen und prüfbar formulieren.',
  free: 'Fokus: hilfreiche Einordnung ohne unnötige Schwere.'
};

const POLICY_INSTRUCTIONS: Record<ResponsePolicy, string> = {
  full_work_block:
    'Wenn genug Kontext vorhanden ist und der Arbeitsmodus klar ist, darfst du den vollen 4-Block verwenden: KERNLAGE, ANNAHMEN, NICHT IGNORIEREN, NÄCHSTER SCHRITT. Bleibe prägnant, arbeitsnah und konkret.',
  compact_work_block:
    'Wenn der Arbeitsmodus klar ist, aber der Kontext noch dünn oder allgemein ist, antworte kompakter. Nutze keinen schweren Vollblock. Gib stattdessen eine kurze Kernlage, 1–2 relevante Punkte und genau einen provisorischen nächsten Schritt oder eine gezielte Rückfrage.',
  clarify:
    'Wenn wesentliche Angaben für eine belastbare Arbeitsantwort fehlen, antworte kurz. Sage knapp, was noch fehlt, und stelle genau eine gute Rückfrage. Vermeide einen vollen 4-Block und vermeide Schemakaskaden.',
  light_social:
    'Bei Begrüßung, Smalltalk oder sehr leichter sozialer Eingabe antworte kurz, natürlich und warm, ohne Kitsch. Verwende keinen 4-Block und keine künstliche Tiefenanalyse. Biete nur sanft an, ins Arbeiten zu wechseln, wenn es passt.'
};

export function getSystemInstruction(mode: WorkMode, text = ''): string {
  const policy = classifyResponsePolicy(text, mode);
  return [
    'Du bist Maya, eine fokussierte Arbeitsbegleiterin. Antworte prägnant und auf Deutsch.',
    MODE_FOCUS[mode],
    POLICY_INSTRUCTIONS[policy]
  ].join(' ');
}

function excerpt(text: string, max = 60): string {
  const t = text.trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

/** Generate a structured local response for file-mode (no real AI provider needed). */
export function generateLocalResponse(input: string, mode: WorkMode): string {
  const ex = excerpt(input);

  switch (mode) {
    case 'step':
      return [
        `KERNLAGE`,
        `„${ex}" — ich fokussiere auf den nächsten konkreten Schritt.`,
        ``,
        `ANNAHMEN`,
        `· Du hast genug Überblick, um jetzt handeln zu können`,
        `· Der nächste Schritt ist nicht von einer offenen Entscheidung blockiert`,
        `· Es geht jetzt um Umsetzung, nicht um weitere Analyse`,
        ``,
        `NICHT IGNORIEREN`,
        `· Der „offensichtlichste" Schritt ist selten der wertvollste — kurz prüfen, ob er wirklich weiterbringt`,
        `· Kleine Vorbedingungen, die erst beim Angehen sichtbar werden`,
        ``,
        `NÄCHSTER SCHRITT`,
        `Formuliere den kleinsten abschließbaren Schritt für heute — nicht die ganze Aufgabe, nur den nächsten Zug. Was tust du als Erstes?`,
        ``,
        `─`,
        `Lokaler Modus · Mit einem konfigurierten Anbieter würde Maya inhaltlich auf dein Thema eingehen.`,
      ].join('\n');

    case 'risk':
      return [
        `KERNLAGE`,
        `„${ex}" — ich schaue, was du dabei nicht übersehen solltest.`,
        ``,
        `ANNAHMEN`,
        `· Du kennst das Thema gut genug, um blinde Flecken zu haben`,
        `· Der offensichtliche Weg ist klar — aber nicht zwingend risikofrei`,
        `· Es gibt mindestens eine nicht-offensichtliche Konsequenz`,
        ``,
        `NICHT IGNORIEREN`,
        `· Was du nicht sagst: implizite Zeitannahmen, versteckte Abhängigkeiten, ungeprüfte Voraussetzungen`,
        `· Der Unterschied zwischen „hat immer funktioniert" und „wird immer funktionieren"`,
        `· Was passiert, wenn der Plan nicht aufgeht — gibt es einen Rückweg?`,
        ``,
        `NÄCHSTER SCHRITT`,
        `Benenne eine Sache, die schiefgehen könnte und über die du bisher nicht nachgedacht hast. Dann entscheide: ignorierbar oder nicht?`,
        ``,
        `─`,
        `Lokaler Modus · Mit einem konfigurierten Anbieter würde Maya inhaltlich auf dein Thema eingehen.`,
      ].join('\n');

    case 'assumption':
      return [
        `KERNLAGE`,
        `„${ex}" — ich mache implizite Annahmen sichtbar.`,
        ``,
        `ANNAHMEN (explizit gemacht)`,
        `· Die Situation ist stabiler als sie wirkt`,
        `· Andere Beteiligte sehen das genauso wie du`,
        `· Der bisherige Ansatz war grundsätzlich richtig`,
        `· Der Zeitrahmen ist realistisch`,
        ``,
        `NICHT IGNORIEREN`,
        `· Annahmen, die ungeprüft als Fakten behandelt werden, sind die häufigste Quelle von Fehlentscheidungen`,
        `· „Das war immer so" ist keine Prüfung — es ist eine ungeprüfte Annahme`,
        ``,
        `NÄCHSTER SCHRITT`,
        `Schreib 3 Sätze, die mit „Ich nehme an, dass …" beginnen. Prüfe jeden einzeln: Stimmt das wirklich? Woher weißt du das?`,
        ``,
        `─`,
        `Lokaler Modus · Mit einem konfigurierten Anbieter würde Maya inhaltlich auf dein Thema eingehen.`,
      ].join('\n');

    case 'free':
    default:
      return [
        `KERNLAGE`,
        `„${ex}" — ich nehme das als Arbeitspunkt.`,
        ``,
        `ANNAHMEN`,
        `· Das Thema ist klarer in deinem Kopf als es klingt`,
        `· Es gibt einen Grund, warum du jetzt daran denkst`,
        `· Ein nächster Schritt ist möglich — auch wenn er noch nicht sichtbar ist`,
        ``,
        `NICHT IGNORIEREN`,
        `· Was du gerade nicht sagst, ist oft genauso wichtig wie das, was du sagst`,
        `· Wenn etwas unklar ist, ist das ein Signal — kein Problem`,
        ``,
        `NÄCHSTER SCHRITT`,
        `Was wäre der kleinste Schritt, der dich in Bezug auf „${ex}" konkret weiterbringt?`,
        ``,
        `─`,
        `Lokaler Modus · Mit einem konfigurierten Anbieter würde Maya inhaltlich auf dein Thema eingehen.`,
      ].join('\n');
  }
}
