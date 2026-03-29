import { describe, expect, it } from 'vitest';

import {
  buildEpistemicGuardrail,
  buildMirror,
  detectFreshnessWarning,
  detectOverclaimWarning
} from '../../lib/maya-epistemic-guardrail';

describe('/api/maya/chat guardrail helpers', () => {
  it('builds a fallback mirror when no usable user message is present', () => {
    expect(buildMirror('   ')).toBe('Kernanliegen erkannt: Kein belastbarer Nutzersatz für die Spiegelung vorhanden.');
  });

  it('warns on ungrounded absolute overclaim language', () => {
    const warning = detectOverclaimWarning(
      'Prüf bitte den Stand kurz.',
      'Das ist definitiv vollständig gelöst und zweifellos korrekt.'
    );

    expect(warning).toBe('Antwort klingt stellenweise zu sicher. Prüfe, ob die Behauptung wirklich durch Input, Repo-Stand oder Kontext gedeckt ist.');
  });

  it('does not warn on repo-grounded certainty language', () => {
    const warning = detectOverclaimWarning(
      'Prüf bitte den Repo-Stand.',
      'Der Commit zeigt definitiv, dass die Route in dieser Datei angepasst wurde.'
    );

    expect(warning).toBeNull();
  });

  it('does not warn when the user explicitly asked for certainty', () => {
    const warning = detectOverclaimWarning(
      'Kannst du sicher sagen, ob das bewiesen ist?',
      'Das ist definitiv vollständig gelöst.'
    );

    expect(warning).toBeNull();
  });

  it('warns on time-sensitive claims without a freshness anchor', () => {
    const warning = detectFreshnessWarning(
      'Aktuell ist das die neueste Lösung und derzeit die richtige Einschätzung.'
    );

    expect(warning).toBe('Antwort enthält zeitabhängige Aussagen ohne klaren Frischeanker. Prüfe, ob Stand, Commit oder Datum explizit benannt werden sollte.');
  });

  it('does not warn on time-sensitive claims with a freshness anchor', () => {
    expect(detectFreshnessWarning('Aktuell ist Stand 2026-03-28 mit Commit abc123 relevant.')).toBeNull();

    const guardrail = buildEpistemicGuardrail(
      'Bitte prüf den aktuellen Stand.',
      'Aktuell ist Stand 2026-03-28 mit Commit abc123 relevant.'
    );

    expect(guardrail.mirror).toContain('Bitte prüf den aktuellen Stand.');
    expect(guardrail.overclaimWarning).toBeNull();
    expect(guardrail.freshnessWarning).toBeNull();
  });
});
