"use client";

import { useTalentPayments } from "@/lib/useMockDb";

export function PaymentsOverdueBadge() {
  const items = useTalentPayments();
  const overdueCount = items.filter((item) => item.status === "overdue").length;
  if (overdueCount <= 0) return null;
  return (
    <span className="rounded-full bg-danger px-3.5 py-1.5 font-display text-sm font-semibold whitespace-nowrap text-on-primary">
      {overdueCount} overdue
    </span>
  );
}
