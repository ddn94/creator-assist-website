import { calendarDay, calendarDaysBetween } from "@/lib/calendarDay";
import { isCalendarStamp } from "@/lib/timestamps";
import { formatLiveDate } from "@/lib/tracker";

export function formatDeliverables(
  deliverables: { type: string; quantity: number }[],
): string {
  if (deliverables.length === 0) return "—";
  return deliverables
    .map((d) => `${d.quantity}× ${d.type}`)
    .join(", ");
}

export function displayDate(iso: string | null): string | null {
  return iso ? formatLiveDate(iso) : null;
}

export function displayShortDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function daysBetween(fromIso: string, to = new Date()): number {
  return calendarDaysBetween(fromIso.slice(0, 10), calendarDay(to));
}

export function timeAgo(iso: string, today = new Date()): string {
  const days = daysBetween(iso, today);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  return formatLiveDate(iso);
}

/** Clock time for a real timestamp on this local day; otherwise a date. Never "Today". */
export function activityWhen(iso: string, now = new Date()): string {
  const when = iso.includes("T")
    ? new Date(iso)
    : new Date(`${iso.slice(0, 10)}T12:00:00`);
  const sameDay =
    !Number.isNaN(when.getTime()) &&
    when.getFullYear() === now.getFullYear() &&
    when.getMonth() === now.getMonth() &&
    when.getDate() === now.getDate();
  if (sameDay && !isCalendarStamp(iso)) {
    return when.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const day = iso.slice(0, 10);
  const relative = timeAgo(day, now);
  if (relative === "Today") return formatLiveDate(day);
  return relative;
}
