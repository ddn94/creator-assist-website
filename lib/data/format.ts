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
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function daysBetween(fromIso: string, to = new Date()): number {
  const from = new Date(`${fromIso}T12:00:00`);
  const today = new Date(`${to.toISOString().slice(0, 10)}T12:00:00`);
  return Math.round((today.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
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
