export type MayaEpistemicGuardrail = {
  mirror: string;
  overclaimWarning: string | null;
  freshnessWarning: string | null;
};

export function buildEpistemicGuardrail(userMessage: string, assistantMessage: string): MayaEpistemicGuardrail {
  const mirror = buildMirror(userMessage);
  const overclaimWarning = detectOverclaimWarning(userMessage, assistantMessage);
  const freshnessWarning = detectFreshnessWarning(assistantMessage);

  return {
    mirror,
    overclaimWarning,
    freshnessWarning
  };
}

export function buildMirror(userMessage: string): string {
  const normalized = normalizeForGuardrail(userMessage);
  if (!normalized) {
    return 'Kernanliegen erkannt: Kein belastbarer Nutzersatz für die Spiegelung vorhanden.';
  }

  const firstSegment = normalized
    .split(/(?<=[.!?])\s+|\n+/)
    .map((segment) => segment.trim())
    .find((segment) => segment.length >= 12) || normalized;

  return `Kernanliegen erkannt: ${truncateGuardrailText(firstSegment, 180)}`;
}

export function detectOverclaimWarning(userMessage: string, assistantMessage: string): string | null {
  const normalizedAssistant = normalizeForGuardrail(assistantMessage).toLowerCase();
  const normalizedUser = normalizeForGuardrail(userMessage).toLowerCase();

  if (!normalizedAssistant) {
    return null;
  }

  const absoluteClaimPattern = /\b(garantiert|definitiv|zweifellos|ohne zweifel|zweifelsfrei|vollständig|bewiesen)\b/i;
  const hedgePattern = /\b(vielleicht|wahrscheinlich|vermutlich|kann|könnte|scheint|nach aktuellem stand|soweit sichtbar|nach sichtbarem stand|ich vermute|ich nehme an)\b/i;
  const repoGroundingPattern = /\b(repo|repository|code|commit|hash|diff|datei|pfad|route|komponente|funktion|zeile|typescript|tsx|ts|json|md)\b/i;
  const userAskedForCertainty = /\b(sicher|garantiert|eindeutig|definitiv|beweisen|beweis)\b/i.test(normalizedUser);

  if (
    absoluteClaimPattern.test(normalizedAssistant) &&
    !hedgePattern.test(normalizedAssistant) &&
    !repoGroundingPattern.test(normalizedAssistant) &&
    !userAskedForCertainty
  ) {
    return 'Antwort klingt stellenweise zu sicher. Prüfe, ob die Behauptung wirklich durch Input, Repo-Stand oder Kontext gedeckt ist.';
  }

  return null;
}

export function detectFreshnessWarning(assistantMessage: string): string | null {
  const normalizedAssistant = normalizeForGuardrail(assistantMessage);
  if (!normalizedAssistant) {
    return null;
  }

  const timeSensitivePattern = /\b(aktuell|derzeit|momentan|heute|neueste|latest|kürzlich|zurzeit|gegenwärtig)\b/i;
  const freshnessAnchorPattern = /\b(commit|hash|version|stand|timestamp|utc|20\d{2}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.20\d{2})\b/i;
  const repoContextPattern = /\b(repo|repository|code|datei|pfad|route|komponente|api|ui|lokal|workspace|working tree)\b/i;

  if (
    timeSensitivePattern.test(normalizedAssistant) &&
    !freshnessAnchorPattern.test(normalizedAssistant) &&
    !repoContextPattern.test(normalizedAssistant)
  ) {
    return 'Antwort enthält zeitabhängige Aussagen ohne klaren Frischeanker. Prüfe, ob Stand, Commit oder Datum explizit benannt werden sollte.';
  }

  return null;
}

function normalizeForGuardrail(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function truncateGuardrailText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
