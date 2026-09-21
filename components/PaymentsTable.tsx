"use client";

import { useMemo, useState } from "react";
import { FilterPills } from "@/components/FilterPills";
import { PaymentRow } from "@/components/PaymentRow";
import { Text } from "@/components/Text";
import type { PaymentStatus } from "@/lib/payments";
import { useAgencyPayments } from "@/lib/useMockDb";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "awaiting", label: "Awaiting payment" },
  { id: "notInvoiced", label: "Not invoiced" },
  { id: "paid", label: "Paid" },
] as const;

type PaymentFilter = (typeof FILTERS)[number]["id"];

type PaymentsTableProps = {
  className?: string;
};

const HEADERS = [
  "Talent",
  "Content",
  "Brand",
  "Fee",
  "Terms",
  "Delivered",
  "Invoiced",
  "Due",
  "Status",
  "Paid",
  "",
] as const;

export function PaymentsTable({ className = "" }: PaymentsTableProps) {
  const items = useAgencyPayments();
  const [filter, setFilter] = useState<PaymentFilter>("all");

  const counts = useMemo(() => {
    const next = {
      all: items.length,
      overdue: 0,
      awaiting: 0,
      notInvoiced: 0,
      paid: 0,
    };
    for (const item of items) {
      next[item.status] += 1;
    }
    return next;
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === (filter as PaymentStatus));
  }, [filter, items]);

  const pills = FILTERS.map((item) => ({
    id: item.id,
    label: item.label,
    count: item.id === "all" || item.id === "paid" ? undefined : counts[item.id],
  }));

  return (
    <div className={className}>
      <FilterPills
        items={pills}
        value={filter}
        onChange={(id) => setFilter(id as PaymentFilter)}
      />

      <div className="mt-4 overflow-x-auto rounded-card border border-card-border bg-card shadow-card">
        <table className="w-full min-w-[64rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-card-border bg-background/70">
              {HEADERS.map((label) => (
                <th
                  key={label || "action"}
                  scope="col"
                  className="px-3 py-3 first:px-4 last:px-4"
                >
                  {label ? (
                    <Text variant="caption" className="font-medium">
                      {label}
                    </Text>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))
            ) : (
              <tr>
                <td colSpan={HEADERS.length} className="px-4 py-8 text-center">
                  <Text variant="description">No payments in this filter.</Text>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
