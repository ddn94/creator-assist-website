import {
  calendarDay,
  calendarDayInZone,
  calendarDaysBetween,
} from "@/lib/calendarDay";
import { toDateInput } from "@/lib/timestamps";
import { formatLiveDate } from "@/lib/tracker";

export function formatDeliverables(
  deliverables: { type: string; quantity: number }[],
): string {
  if (deliverables.length === 0) return "—";
  return deliverables
    .map((d) => `${d.quantity}× ${d.type}`)
    .join(", ");
}

export function displayDate(
  iso: string | null,
  timeZone?: string | null,
): string | null {
  return iso ? formatLiveDate(iso, timeZone) : null;
}

export function displayShortDate(
  iso: string | null,
  timeZone?: string | null,
): string | null {
  if (!iso) return null;
  const day = toDateInput(iso, timeZone);
  if (!day) return null;
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function daysBetween(
  fromIso: string,
  to = new Date(),
  timeZone?: string | null,
): number {
  const fromDay = toDateInput(fromIso, timeZone) || fromIso.slice(0, 10);
  const todayDay = timeZone
    ? calendarDayInZone(to, timeZone)
    : calendarDay(to);
  return calendarDaysBetween(fromDay, todayDay);
}

export function timeAgo(
  iso: string,
  today = new Date(),
  timeZone?: string | null,
): string {
  const day = toDateInput(iso, timeZone) || iso.slice(0, 10);
  const todayDay = timeZone
    ? calendarDayInZone(today, timeZone)
    : calendarDay(today);
  const days = calendarDaysBetween(day, todayDay);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  return formatLiveDate(iso, timeZone);
}

/** Clock time on this local day; otherwise a date. Never "Today". */
export function activityWhen(
  iso: string,
  now = new Date(),
  timeZone?: string | null,
): string {
  const when = iso.includes("T")
    ? new Date(iso)
    : new Date(`${iso.slice(0, 10)}T12:00:00.000Z`);
  if (Number.isNaN(when.getTime())) return "—";

  const whenDay = toDateInput(iso, timeZone);
  const nowDay = timeZone
    ? calendarDayInZone(now, timeZone)
    : calendarDay(now);

  if (whenDay && whenDay === nowDay && iso.includes("T")) {
    return when.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      ...(timeZone ? { timeZone } : {}),
    });
  }
  const relative = timeAgo(iso, now, timeZone);
  if (relative === "Today") return formatLiveDate(iso, timeZone);
  return relative;
}
