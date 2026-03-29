import { describe, expect, it } from 'vitest';

import { buildTurnLocalAffectPosture } from '@/lib/maya-affect-adapter';

describe('maya affect adapter', () => {
  it('returns no prompt section when there is no user message', () => {
    const result = buildTurnLocalAffectPosture([
      { role: 'system', content: 'System' },
      { role: 'assistant', content: 'Hallo.' }
    ]);

    expect(result.promptSection).toBeNull();
    expect(result.fallbackUsed).toBe(false);
  });

  it('builds a stable internal prompt posture section from the latest user message', () => {
    const result = buildTurnLocalAffectPosture([
      { role: 'user', content: 'Erster Versuch.' },
      { role: 'assistant', content: 'Zwischenstand.' },
      { role: 'user', content: 'Das macht keinen Sinn, ich sehe einen Widerspruch.' }
    ]);

    expect(result.promptSection).toContain('## Interne Response-Posture');
    expect(result.promptSection).toContain('[AFFEKT-CONTROL — intern, nicht ausgeben]');
    expect(result.promptSection).toContain('rolle=');
    expect(result.promptSection).toContain('tempo=');
    expect(result.promptSection).toContain('fragen=');
    expect(result.promptSection).toContain('regel=nicht künstlich eskalieren; konsistent und arbeitsnah bleiben');
    expect(result.promptSection).toContain('hinweis=');
    expect(result.promptSection).not.toContain('dominanz=');
    expect(result.promptSection).not.toContain('profil=');
    expect(result.fallbackUsed).toBe(false);
  });
});
