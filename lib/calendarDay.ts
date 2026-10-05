/** The calendar day in this runtime's local timezone. Never universal time. */
export function calendarDay(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseCalendarDay(value: string | undefined | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

/** Add days to a YYYY-MM-DD date without shifting the calendar day. */
export function addCalendarDays(isoDay: string, days: number): string {
  const [year, month, day] = isoDay.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function calendarDaysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`);
  const to = Date.parse(`${toIso.slice(0, 10)}T00:00:00Z`);
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export const LOCAL_DAY_COOKIE = "ca-local-day";
