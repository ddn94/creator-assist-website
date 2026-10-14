"use client";

export function PaymentsOverdueBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-danger px-3.5 py-1.5 font-display text-sm font-semibold whitespace-nowrap text-on-primary">
      {count} overdue
    </span>
  );
}
