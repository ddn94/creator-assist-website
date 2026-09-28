export function nowTimestamp(): string {
  return new Date().toISOString();
}

/** A chosen calendar day is stored at noon UTC. A real action keeps its clock time. */
export function isCalendarStamp(iso: string): boolean {
  if (!iso.includes("T")) return true;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return true;
  return (
    parsed.getUTCHours() === 12 &&
    parsed.getUTCMinutes() === 0 &&
    parsed.getUTCSeconds() === 0 &&
    parsed.getUTCMilliseconds() === 0
  );
}

/** Persist a date or an existing timestamp. Date-only values stay on that calendar day. */
export function toTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("T")) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T12:00:00.000Z`;
  }
  return null;
}

/** Keep a real timestamp when the calendar day did not change. */
export function mergeTimestamp(
  previous: string | null | undefined,
  next: string | null | undefined,
): string | null {
  const stored = toTimestamp(next);
  if (!stored || !previous) return stored;
  if (previous.slice(0, 10) !== stored.slice(0, 10)) return stored;
  if (!isCalendarStamp(previous)) return toTimestamp(previous);
  return stored;
}

/** Calendar day for a date field. Real timestamps use the local day. */
export function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed.includes("T")) return trimmed.slice(0, 10);
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = isCalendarStamp(trimmed)
    ? parsed.getUTCFullYear()
    : parsed.getFullYear();
  const month = isCalendarStamp(trimmed)
    ? parsed.getUTCMonth()
    : parsed.getMonth();
  const day = isCalendarStamp(trimmed)
    ? parsed.getUTCDate()
    : parsed.getDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
