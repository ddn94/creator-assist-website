import {
  calendarDay,
  calendarDayInZone,
  parseCalendarDay,
} from "@/lib/calendarDay";

/** Right now, as UTC ISO. Use for clicks and other real moments. */
export function nowTimestamp(): string {
  return new Date().toISOString();
}

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

/**
 * UTC ISO for noon on a calendar day in the given zone.
 * Falls back to noon UTC on that date label when the zone is unknown.
 */
export function dayToTimestamp(
  day: string,
  timeZone?: string | null,
): string | null {
  const parsed = parseCalendarDay(day);
  if (!parsed) return null;
  if (!timeZone) return `${parsed}T12:00:00.000Z`;

  const hour = 12;
  let utc = Date.parse(`${parsed}T${String(hour).padStart(2, "0")}:00:00.000Z`);
  for (let i = 0; i < 3; i++) {
    const wall = partsInZone(new Date(utc), timeZone);
    const asUtc = Date.UTC(
      wall.year,
      wall.month - 1,
      wall.day,
      wall.hour,
      wall.minute,
      wall.second,
    );
    const offset = asUtc - utc;
    const desired = Date.UTC(
      Number(parsed.slice(0, 4)),
      Number(parsed.slice(5, 7)) - 1,
      Number(parsed.slice(8, 10)),
      hour,
      0,
      0,
    );
    utc = desired - offset;
  }
  return new Date(utc).toISOString();
}

/** Persist any date field as UTC ISO. Date-only values use the viewer's zone. */
export function toTimestamp(
  value: string | null | undefined,
  timeZone?: string | null,
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("T")) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return dayToTimestamp(trimmed, timeZone);
}

/**
 * Keep the previous clock time when the calendar day did not change.
 * Otherwise store the next value as UTC.
 */
export function mergeTimestamp(
  previous: string | null | undefined,
  next: string | null | undefined,
  timeZone?: string | null,
): string | null {
  const stored = toTimestamp(next, timeZone);
  if (!stored || !previous) return stored;
  if (toDateInput(previous, timeZone) !== toDateInput(stored, timeZone)) {
    return stored;
  }
  if (next && !next.includes("T")) {
    const prev = new Date(previous);
    return Number.isNaN(prev.getTime()) ? stored : prev.toISOString();
  }
  return stored;
}

/** Calendar day for a date field, in the viewer's zone (or this runtime). */
export function toDateInput(
  value: string | null | undefined,
  timeZone?: string | null,
): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!trimmed.includes("T") && parseCalendarDay(trimmed)) return trimmed;
  const parsed = trimmed.includes("T")
    ? new Date(trimmed)
    : new Date(`${trimmed.slice(0, 10)}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  return timeZone
    ? calendarDayInZone(parsed, timeZone)
    : calendarDay(parsed);
}
