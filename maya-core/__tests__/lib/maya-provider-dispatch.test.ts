import { describe, expect, it } from 'vitest';

import { buildPreDispatchCrushLight } from '../../lib/maya-provider-dispatch';

describe('maya provider dispatch pre-dispatch crush light', () => {
  it('returns null when no user message is present', () => {
    const result = buildPreDispatchCrushLight([
      { role: 'system', content: 'System' },
      { role: 'assistant', content: 'Zwischenstand.' }
    ]);

    expect(result).toBeNull();
  });

  it('extracts the latest user core request as an internal prompt section', () => {
    const result = buildPreDispatchCrushLight([
      { role: 'user', content: 'Erster Kontext.' },
      { role: 'assistant', content: 'Zwischenstand.' },
      {
        role: 'user',
        content: 'Ich bin unsicher wegen der Architektur. Kannst du bitte zuerst den Runtime-Pfad prüfen und danach nur den kleinsten sicheren Fix implementieren?'
      }
    ]);

    expect(result).toContain('## Pre-Dispatch Crush Light');
    expect(result).toContain('[CRUSH-LIGHT — intern, nicht ausgeben]');
    expect(result).toContain('nicht_wegstreichbarer_kern=Kannst du bitte zuerst den Runtime-Pfad prüfen und danach nur den kleinsten sicheren Fix implementieren?');
    expect(result).toContain('regel=Antworte zuerst auf diesen Kern; Nebenspuren nur unterstützen, nicht verdrängen.');
  });

  it('uses the latest user message as the active focus source instead of earlier context', () => {
    const result = buildPreDispatchCrushLight([
      {
        role: 'user',
        content: 'Bitte prüf zuerst die Architektur, die Navigation, das Routing und alle Begleitpfade sehr breit.'
      },
      { role: 'assistant', content: 'Ich schaue drauf.' },
      {
        role: 'user',
        content: 'Kannst du jetzt nur noch den kleinsten sicheren Runtime-Fix prüfen?'
      }
    ]);

    expect(result).toContain('nicht_wegstreichbarer_kern=Kannst du jetzt nur noch den kleinsten sicheren Runtime-Fix prüfen?');
    expect(result).not.toContain('Navigation');
  });

  it('falls back to the longest substantive segment when no explicit request phrase is present', () => {
    const result = buildPreDispatchCrushLight([
      {
        role: 'user',
        content: 'Kurzer Auftakt. Der eigentliche Druck liegt darin, dass der Dispatch-Pfad mehrere konkurrierende Hinweise enthält und der Fokus auf den kleinsten belastbaren Eingriff verloren geht.'
      }
    ]);

    expect(result).toContain('nicht_wegstreichbarer_kern=Der eigentliche Druck liegt darin, dass der Dispatch-Pfad mehrere konkurrierende Hinweise enthält und der Fokus auf den kleinsten belastbaren Eingriff verloren geht.');
  });
});
