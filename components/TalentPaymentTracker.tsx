"use client";

import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { FilterPills } from "@/components/FilterPills";
import { TalentPaymentCard } from "@/components/TalentPaymentCard";
import { TalentPaymentRow } from "@/components/TalentPaymentRow";
import { Text } from "@/components/Text";
import type { PaymentStatus } from "@/lib/payments";
import {
  markContentInvoiced,
  markContentPaid,
} from "@/lib/mockStore";
import { useTalentPayments } from "@/lib/useMockDb";
import type { PaymentTerms } from "@/lib/tracker";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "awaiting", label: "Awaiting payment" },
  { id: "notInvoiced", label: "Not invoiced" },
  { id: "paid", label: "Paid" },
] as const;

type PaymentFilter = (typeof FILTERS)[number]["id"];
type SortKey = "due" | "status";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<PaymentStatus, number> = {
  overdue: 0,
  awaiting: 1,
  notInvoiced: 2,
  paid: 3,
};

const HEADERS = [
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
] as const;

function parseDue(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = Date.parse(value);
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export function TalentPaymentTracker() {
  const items = useTalentPayments();
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [sort, setSort] = useState<SortKey>("due");
  const [dir, setDir] = useState<SortDir>("asc");

  const counts = useMemo(() => {
    const next = {
      all: items.length,
      overdue: 0,
      awaiting: 0,
      notInvoiced: 0,
      paid: 0,
    };
    for (const item of items) next[item.status] += 1;
    return next;
  }, [items]);

  const sorted = useMemo(() => {
    const mul = dir === "desc" ? -1 : 1;
    return [...items].sort((a, b) => {
      if (sort === "status") {
        return mul * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      }
      const at = parseDue(a.due);
      const bt = parseDue(b.due);
      return mul * (at === bt ? 0 : at < bt ? -1 : 1);
    });
  }, [items, sort, dir]);

  const filtered = useMemo(() => {
    if (filter === "all") return sorted;
    return sorted.filter((item) => item.status === (filter as PaymentStatus));
  }, [sorted, filter]);

  const pills = FILTERS.map((item) => ({
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

  function markPaid(id: string) {
    markContentPaid(id);
  }

  function markInvoiced(id: string, terms: string) {
    markContentInvoiced(id, terms as PaymentTerms);
  }
  return (
    <div>
      <div className="md:hidden">
        <FilterPills
          className="flex-nowrap overflow-x-auto"
          items={pills}
          value={filter}
          onChange={(id) => setFilter(id as PaymentFilter)}
        />
        <div className="mt-3 space-y-3">
          {filtered.map((payment) => (
            <TalentPaymentCard
              key={payment.id}
              payment={payment}
              onMarkPaid={markPaid}
              onMarkInvoiced={markInvoiced}
            />
          ))}
          {filtered.length === 0 ? (
            <Text variant="caption" className="py-10 text-center text-sm">
              No deals in this filter.
            </Text>
          ) : null}
        </div>
      </div>

      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-card border border-card-border bg-card shadow-card">
          <table className="w-full min-w-[64rem] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-card-border bg-background/70">
                {HEADERS.map((label) => {
                  const sortable = label === "Due" || label === "Status";
                  const key: SortKey = label === "Status" ? "status" : "due";
                  const active = sortable && sort === key;
                  return (
                    <th
                      key={label}
                      scope="col"
                      className="px-3 py-3 first:px-4 last:px-4"
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(key)}
                          className="inline-flex items-center gap-1 text-left"
                        >
                          <Text variant="caption" className="text-xs font-medium">
                            {label}
                          </Text>
                          {active ? (
                            dir === "asc" ? (
                              <CaretUpIcon size={12} weight="bold" aria-hidden />
                            ) : (
                              <CaretDownIcon
                                size={12}
                                weight="bold"
                                aria-hidden
                              />
                            )
                          ) : null}
                        </button>
                      ) : (
                        <Text variant="caption" className="text-xs font-medium">
                          {label}
                        </Text>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((payment) => (
                  <TalentPaymentRow
                    key={payment.id}
                    payment={payment}
                    onMarkPaid={markPaid}
                    onMarkInvoiced={markInvoiced}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={HEADERS.length} className="px-4 py-8 text-center">
                    <Text variant="description">
                      No paid collabs yet. Create one in the Content Tracker with
                      type “Paid collab”.
                    </Text>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
