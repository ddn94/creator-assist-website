"use client";

import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterPills } from "@/components/FilterPills";
import { PaymentCard } from "@/components/PaymentCard";
import { PaymentRow } from "@/components/PaymentRow";
import { Text } from "@/components/Text";
import {
  markContentInvoicedAction,
  markContentPaidAction,
} from "@/lib/data/actions";
import { markInvoiced, markPaid } from "@/lib/payments";
import {
  PAYMENT_STATUS_FILTERS,
  PAYMENT_STATUS_ORDER,
  type PaymentItem,
  type PaymentMode,
  type PaymentStatus,
} from "@/lib/payments";
import type { PaymentTerms } from "@/lib/tracker";

type PaymentFilter = (typeof PAYMENT_STATUS_FILTERS)[number]["id"];
type SortKey = "due" | "status";
type SortDir = "asc" | "desc";

type PaymentListProps = {
  mode: PaymentMode;
  items: PaymentItem[];
  className?: string;
};

function parseDue(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = Date.parse(value);
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function headersFor(mode: PaymentMode): string[] {
  if (mode === "agency") {
    return [
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
    ];
  }
  return [
    "Content",
    "Brand",
    "Fee",
    "Deliverables",
    "Terms",
    "Delivered",
    "Invoiced",
    "Due",
    "Status",
    "Paid",
    "Actions",
  ];
}

export function PaymentList({ mode, items, className = "" }: PaymentListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [sort, setSort] = useState<SortKey>("due");
  const [dir, setDir] = useState<SortDir>("asc");
  const headers = headersFor(mode);
  const serverKey = items
    .map(
      (item) =>
        `${item.id}:${item.status}:${item.dateInvoicedIso}:${item.datePaidIso}:${item.paymentTerms}`,
    )
    .join("|");
  const [draft, setDraft] = useState<{
    key: string;
    rows: PaymentItem[];
  } | null>(null);
  const rows = draft?.key === serverKey ? draft.rows : items;

  function replaceRow(next: PaymentItem) {
    const base = draft?.key === serverKey ? draft.rows : items;
    setDraft({
      key: serverKey,
      rows: base.map((row) => (row.id === next.id ? next : row)),
    });
  }

  const counts = useMemo(() => {
    const next: Record<"all" | PaymentStatus, number> = {
      all: rows.length,
      overdue: 0,
      awaiting_payment: 0,
      not_invoiced: 0,
      paid: 0,
    };
    for (const item of rows) next[item.status] += 1;
    return next;
  }, [rows]);

  const sorted = useMemo(() => {
    if (mode !== "talent") return rows;
    const mul = dir === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => {
      if (sort === "status") {
        return (
          mul *
          (PAYMENT_STATUS_ORDER[a.status] - PAYMENT_STATUS_ORDER[b.status])
        );
      }
      const at = parseDue(a.due);
      const bt = parseDue(b.due);
      return mul * (at === bt ? 0 : at < bt ? -1 : 1);
    });
  }, [rows, sort, dir, mode]);

  const filtered = useMemo(() => {
    if (filter === "all") return sorted;
    return sorted.filter((item) => item.status === filter);
  }, [sorted, filter]);

  const pills = PAYMENT_STATUS_FILTERS.map((item) => ({
    id: item.id,
    label: item.label,
    count:
      item.id === "all" || item.id === "paid" ? undefined : counts[item.id],
  }));

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSort(key);
    setDir("asc");
  }

  async function onMarkPaid(id: string) {
    const current = rows.find((row) => row.id === id);
    if (!current) return;
    replaceRow(markPaid(current));
    const result = await markContentPaidAction(id);
    if (result.error) {
      replaceRow(current);
      return;
    }
    router.refresh();
  }

  async function onMarkInvoiced(id: string, terms: string) {
    const current = rows.find((row) => row.id === id);
    if (!current) return;
    replaceRow(markInvoiced(current, terms as PaymentTerms));
    const result = await markContentInvoicedAction(id, terms as PaymentTerms);
    if (result.error) {
      replaceRow(current);
      return;
    }
    router.refresh();
  }

  const emptyMessage =
    mode === "talent"
      ? "No paid collabs yet. Create one in the Content Tracker with type “Paid collab”."
      : "No payments in this filter.";

  const table = (
    <div className="overflow-x-auto rounded-card border border-card-border bg-card shadow-card">
      <table
        className={[
          "w-full min-w-[64rem] border-collapse text-left",
          mode === "talent" ? "text-xs" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <thead>
          <tr className="border-b border-card-border bg-background/70">
            {headers.map((label) => {
              const sortable =
                mode === "talent" && (label === "Due" || label === "Status");
              const key: SortKey = label === "Status" ? "status" : "due";
              const active = sortable && sort === key;
              return (
                <th
                  key={label || "action"}
                  scope="col"
                  className="px-3 py-3 first:px-4 last:px-4"
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(key)}
                      className="inline-flex items-center gap-1 text-left"
                    >
                      <Text
                        variant="caption"
                        className="text-xs font-medium"
                      >
                        {label}
                      </Text>
                      {active ? (
                        dir === "asc" ? (
                          <CaretUpIcon size={12} weight="bold" aria-hidden />
                        ) : (
                          <CaretDownIcon size={12} weight="bold" aria-hidden />
                        )
                      ) : null}
                    </button>
                  ) : label ? (
                    <Text
                      variant="caption"
                      className={
                        mode === "talent" ? "text-xs font-medium" : "font-medium"
                      }
                    >
                      {label}
                    </Text>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filtered.length > 0 ? (
            filtered.map((payment) => (
              <PaymentRow
                key={payment.id}
                mode={mode}
                payment={payment}
                onReplace={replaceRow}
                onMarkPaid={onMarkPaid}
                onMarkInvoiced={onMarkInvoiced}
              />
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center">
                <Text variant="description">{emptyMessage}</Text>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (mode === "agency") {
    return (
      <div className={className}>
        <FilterPills
          items={pills}
          value={filter}
          onChange={(id) => setFilter(id as PaymentFilter)}
        />
        <div className="mt-4">{table}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="md:hidden">
        <FilterPills
          className="flex-nowrap overflow-x-auto"
          items={pills}
          value={filter}
          onChange={(id) => setFilter(id as PaymentFilter)}
        />
        <div className="mt-3 space-y-3">
          {filtered.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onMarkPaid={onMarkPaid}
              onMarkInvoiced={onMarkInvoiced}
            />
          ))}
          {filtered.length === 0 ? (
            <Text variant="caption" className="py-10 text-center text-sm">
              No deals in this filter.
            </Text>
          ) : null}
        </div>
      </div>
      <div className="hidden md:block">{table}</div>
    </div>
  );
}
