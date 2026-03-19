import { describe, expect, it } from 'vitest';

import {
  classifyResponsePolicy,
  getSystemInstruction,
} from '../../components/maya/maya-local-response';

describe('maya local response policy', () => {
  it('classifies light social free input as light_social', () => {
    expect(classifyResponsePolicy('hi, wie gehts?', 'free')).toBe('light_social');
  });

  it('classifies thin step input as clarify', () => {
    expect(classifyResponsePolicy('Nächsten Schritt klären', 'step')).toBe('clarify');
  });

  it('classifies thin risk input as clarify', () => {
    expect(classifyResponsePolicy('Was nicht ignorieren?', 'risk')).toBe('clarify');
  });

  it('classifies detailed assumption input as full_work_block', () => {
    expect(
      classifyResponsePolicy(
        'Wir haben den echten Providerpfad live, aber die Antworten wirken bei Arbeitsthemen noch zu gleichförmig und ich will die zugrunde liegenden Annahmen sichtbar machen.',
        'assumption'
      )
    ).toBe('full_work_block');
  });

  it('classifies substantive free input as compact_work_block', () => {
    expect(
      classifyResponsePolicy(
        'Wir haben jetzt einen lokalen Arbeitskern und einen bereinigten Providerpfad. Wie würdest du den aktuellen Stand einordnen?',
        'free'
      )
    ).toBe('compact_work_block');
  });

  it('builds light social instruction without forcing the full 4-block', () => {
    const instruction = getSystemInstruction('free', 'hi');

    expect(instruction).toContain('antworte kurz, natürlich und warm');
    expect(instruction).toContain('Verwende keinen 4-Block');
  });

  it('builds clarify instruction for thin starter-style step input', () => {
    const instruction = getSystemInstruction('step', 'Nächsten Schritt klären');

    expect(instruction).toContain('stelle genau eine gute Rückfrage');
    expect(instruction).toContain('Vermeide einen vollen 4-Block');
  });

  it('builds full work block instruction for detailed directed input', () => {
    const instruction = getSystemInstruction(
      'risk',
      'Wir haben jetzt einen echten Providerpfad auf Render, aber freie Eingaben wirken noch zu schwer. Welche Risiken sollten wir in dieser Kalibrierung nicht übersehen?'
    );

    expect(instruction).toContain('darfst du den vollen 4-Block verwenden');
    expect(instruction).toContain('Fokus: Risiken, blinde Flecken');
  });
});
