import { describe, expect, it } from 'vitest';

import { formatMayaTimestamp } from '../../lib/maya-date';

describe('formatMayaTimestamp', () => {
  it('formats valid ISO timestamps for Maya badges', () => {
    expect(formatMayaTimestamp('2026-03-20T16:50:03.000Z')).toBe(new Date('2026-03-20T16:50:03.000Z').toLocaleString('de-DE'));
  });

  it('returns null for empty or unparseable values', () => {
    expect(formatMayaTimestamp('')).toBeNull();
    expect(formatMayaTimestamp('   ')).toBeNull();
    expect(formatMayaTimestamp('not-a-date')).toBeNull();
    expect(formatMayaTimestamp(null)).toBeNull();
    expect(formatMayaTimestamp(undefined)).toBeNull();
  });

  it('accepts numeric timestamps from mixed persistence formats', () => {
    const epoch = 1710953403000;

    expect(formatMayaTimestamp(epoch)).toBe(new Date(epoch).toLocaleString('de-DE'));
    expect(formatMayaTimestamp(String(epoch))).toBe(new Date(epoch).toLocaleString('de-DE'));
  });
});
