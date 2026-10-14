import {
  calendarDay,
  calendarDayInZone,
  calendarDaysBetween,
} from "@/lib/calendarDay";

/**
 * Relative / friendly labels for roster "Last activity".
 * Examples: 5 mins ago, 2 hours ago, Yesterday, 3 days ago, Last Tuesday, 2 weeks ago, 1 month ago.
 */
export function formatRelativeActivity(
  iso: string,
  now = new Date(),
  timeZone?: string | null,
): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "—";

  const nowDay = timeZone
    ? calendarDayInZone(now, timeZone)
    : calendarDay(now);
  const thenDay = timeZone
    ? calendarDayInZone(then, timeZone)
    : calendarDay(then);
  const dayDiff = calendarDaysBetween(thenDay, nowDay);

  if (dayDiff <= 0) {
    const mins = Math.max(
      0,
      Math.floor((now.getTime() - then.getTime()) / (1000 * 60)),
    );
    if (mins < 1) return "Just now";
    if (mins < 60) return mins === 1 ? "1 min ago" : `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff} days ago`;
  if (dayDiff < 14) {
    return `Last ${then.toLocaleDateString("en-US", {
      weekday: "long",
      ...(timeZone ? { timeZone } : {}),
    })}`;
  }
  if (dayDiff < 45) {
    const weeks = Math.max(1, Math.round(dayDiff / 7));
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (dayDiff < 365) {
    const months = Math.max(1, Math.round(dayDiff / 30));
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatShortDayMonth(
  iso: string,
  timeZone?: string | null,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(timeZone ? { timeZone } : {}),
  });
}
