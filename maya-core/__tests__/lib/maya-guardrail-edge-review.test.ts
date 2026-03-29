import { describe, expect, it } from 'vitest';

import {
  buildEpistemicGuardrail,
  buildMirror,
  detectFreshnessWarning,
  detectOverclaimWarning
} from '../../lib/maya-epistemic-guardrail';

describe('maya guardrail edge review', () => {
  it('mirrors the first substantive user segment instead of a short lead-in fragment', () => {
    const mirror = buildMirror('Kurz so. Bitte prüf jetzt nur den sichtbaren Repo-Stand und keine allgemeine Theorie. Danach gern Details.');

    expect(mirror).toBe('Kernanliegen erkannt: Bitte prüf jetzt nur den sichtbaren Repo-Stand und keine allgemeine Theorie.');
  });

  it('currently stays quiet on absolute language when the reply also carries an explicit hedge', () => {
    const warning = detectOverclaimWarning(
      'Prüf bitte kurz den Stand.',
      'Das ist definitiv gelöst, soweit sichtbar im aktuellen Ausschnitt.'
    );

    expect(warning).toBeNull();
  });

  it('currently stays quiet on time-sensitive local workspace phrasing without an explicit freshness anchor', () => {
    const warning = detectFreshnessWarning(
      'Aktuell wirkt der lokale Workspace in dieser Komponente ruhig und ohne neue Drift.'
    );

    expect(warning).toBeNull();

    const guardrail = buildEpistemicGuardrail(
      'Prüf bitte die aktuelle lokale Workspace-Lage.',
      'Aktuell wirkt der lokale Workspace in dieser Komponente ruhig und ohne neue Drift.'
    );

    expect(guardrail.mirror).toContain('Prüf bitte die aktuelle lokale Workspace-Lage.');
    expect(guardrail.overclaimWarning).toBeNull();
    expect(guardrail.freshnessWarning).toBeNull();
  });
});
