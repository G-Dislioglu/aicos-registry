import { describe, expect, it } from 'vitest';

import { buildEpistemicGuardrail } from '../../lib/maya-epistemic-guardrail';

type ObservedMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function buildObservedGuardrail(messages: ObservedMessage[], assistantReply: string) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content || '';

  return buildEpistemicGuardrail(latestUserMessage, assistantReply);
}

describe('maya guardrail signal stability review', () => {
  it('stays quiet on repo-grounded current-state answers with an explicit freshness anchor', () => {
    const guardrail = buildObservedGuardrail(
      [
        {
          role: 'user',
          content: 'Prüf bitte den aktuellen Repo-Stand und sag mir, ob die Route schon nachgezogen ist.'
        }
      ],
      'Aktuell zeigt Commit abc123 im Repo, dass die Route in app/api/maya/chat/route.ts nachgezogen wurde.'
    );

    expect(guardrail.mirror).toContain('Prüf bitte den aktuellen Repo-Stand');
    expect(guardrail.overclaimWarning).toBeNull();
    expect(guardrail.freshnessWarning).toBeNull();
  });

  it('stays quiet when certainty language is explicitly requested and the reply remains repo-grounded', () => {
    const guardrail = buildObservedGuardrail(
      [
        {
          role: 'assistant',
          content: 'Ich prüfe zuerst den Stand.'
        },
        {
          role: 'user',
          content: 'Kannst du sicher sagen, ob der Commit die Datei wirklich geändert hat?'
        }
      ],
      'Definitiv: Der Commit zeigt in der Datei route.ts genau diese Änderung.'
    );

    expect(guardrail.mirror).toContain('Kannst du sicher sagen');
    expect(guardrail.overclaimWarning).toBeNull();
    expect(guardrail.freshnessWarning).toBeNull();
  });

  it('surfaces both warnings when a near-simulated reply becomes absolute and time-sensitive without anchors', () => {
    const guardrail = buildObservedGuardrail(
      [
        {
          role: 'user',
          content: 'Bitte prüf nur den aktuellen Stand und bleib eng am sichtbaren Repo.'
        }
      ],
      'Das ist definitiv vollständig gelöst und aktuell die neueste Lösung.'
    );

    expect(guardrail.mirror).toContain('Bitte prüf nur den aktuellen Stand');
    expect(guardrail.overclaimWarning).toBe('Antwort klingt stellenweise zu sicher. Prüfe, ob die Behauptung wirklich durch Input, Repo-Stand oder Kontext gedeckt ist.');
    expect(guardrail.freshnessWarning).toBe('Antwort enthält zeitabhängige Aussagen ohne klaren Frischeanker. Prüfe, ob Stand, Commit oder Datum explizit benannt werden sollte.');
  });

  it('currently stays quiet on repo-context freshness phrasing even without an explicit commit anchor', () => {
    const guardrail = buildObservedGuardrail(
      [
        {
          role: 'user',
          content: 'Prüf bitte, ob die aktuelle Repo-Lage eher ruhig oder driftig ist.'
        }
      ],
      'Aktuell wirkt der Repo-Stand in dieser Route ruhig und ohne neue Drift.'
    );

    expect(guardrail.mirror).toContain('Prüf bitte, ob die aktuelle Repo-Lage');
    expect(guardrail.overclaimWarning).toBeNull();
    expect(guardrail.freshnessWarning).toBeNull();
  });
});
