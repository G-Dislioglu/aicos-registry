import { describe, expect, it } from 'vitest';

import { buildTurnLocalAffectPosture } from '../../lib/maya-affect-adapter';

function buildMessages(latestUserContent: string) {
  return [
    {
      role: 'user' as const,
      content: 'Ich bin unsicher und ehrlich gesagt etwas lost. Bitte geh sehr vorsichtig mit mir um.'
    },
    {
      role: 'assistant' as const,
      content: 'Ich bleibe ruhig und schaue mit dir darauf.'
    },
    {
      role: 'system' as const,
      content: 'Interner Kontext, nicht relevant für die Affect-Naht.'
    },
    {
      role: 'user' as const,
      content: latestUserContent
    }
  ];
}

describe('maya affect posture audit review', () => {
  it('treats the affect posture seam as turn-local and lets the latest user message override earlier tone pressure', () => {
    const posture = buildTurnLocalAffectPosture(
      buildMessages('Das macht keinen Sinn. Ich sehe einen Widerspruch und will, dass du die Begriffe sauber trennst.')
    );

    expect(posture.promptSection).toContain('## Interne Response-Posture');
    expect(posture.promptSection).toContain('[AFFEKT-CONTROL — intern, nicht ausgeben]');
    expect(posture.promptSection).toContain('rolle=Maya_Klar');
    expect(posture.promptSection).toContain('tempo=normal');
    expect(posture.promptSection).toContain('fragen=hoch');
    expect(posture.promptSection).toContain('Sortiere Begriffe, trenne Ebenen und benenne Widersprüche präzise.');
    expect(posture.promptSection).not.toContain('Maya_Warm');
    expect(posture.fallbackUsed).toBe(false);
  });

  it('keeps the active affect posture seam bounded to an internal prompt hint instead of surfacing broader affect state semantics', () => {
    const posture = buildTurnLocalAffectPosture(
      buildMessages('Ich bin müde und überfordert. Lass uns bitte kürzer und klarer bleiben.')
    );

    expect(posture.promptSection).toContain('## Interne Response-Posture');
    expect(posture.promptSection).toContain('[AFFEKT-CONTROL — intern, nicht ausgeben]');
    expect(posture.promptSection).toContain('rolle=');
    expect(posture.promptSection).toContain('tempo=');
    expect(posture.promptSection).toContain('fragen=');
    expect(posture.promptSection).toContain('regel=');
    expect(posture.promptSection).toContain('hinweis=');
    expect(posture.promptSection).not.toContain('dominanteDimension=');
    expect(posture.promptSection).not.toContain('sekundaereDimension=');
    expect(posture.promptSection).not.toContain('intensitaet=');
    expect(posture.promptSection).not.toContain('profil=');
    expect(posture.promptSection).not.toContain('debugTrace');
    expect(posture.fallbackUsed).toBe(false);
  });

  it('stays absent when there is no latest user message instead of inventing a posture path', () => {
    const posture = buildTurnLocalAffectPosture([
      { role: 'system', content: 'Nur Systemkontext.' },
      { role: 'assistant', content: 'Ich warte auf die nächste User-Nachricht.' }
    ]);

    expect(posture.promptSection).toBeNull();
    expect(posture.fallbackUsed).toBe(false);
  });
});
