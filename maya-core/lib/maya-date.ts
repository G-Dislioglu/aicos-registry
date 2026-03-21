export function formatMayaTimestamp(value: unknown, locale = 'de-DE'): string | null {
  const normalized = normalizeTimestampValue(value);

  if (normalized === null) {
    return null;
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString(locale);
}

function normalizeTimestampValue(value: unknown): string | number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const numericCandidate = Number(trimmed);

  if (!Number.isNaN(numericCandidate) && Number.isFinite(numericCandidate)) {
    return numericCandidate;
  }

  return trimmed;
}
