"use client";

import { useMemo, useState } from "react";
import { FilterPills } from "@/components/FilterPills";
import { Pagination } from "@/components/Pagination";
import { TalentRow } from "@/components/TalentRow";
import { Text } from "@/components/Text";
import type { TalentStatus, TalentItem } from "@/lib/talent";

const PAGE_SIZE = 8;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "invited", label: "Invited" },
  { id: "record", label: "Record only" },
] as const;

type TalentFilter = (typeof FILTERS)[number]["id"];

type TalentTableProps = {
  items: TalentItem[];
  className?: string;
};

const COLUMNS =
  "grid-cols-[minmax(12rem,1.6fr)_7.5rem_minmax(6rem,1fr)_4.5rem_4.5rem_5.5rem_minmax(6rem,1fr)_1.5rem]";

export function TalentTable({ items, className = "" }: TalentTableProps) {
  const [filter, setFilter] = useState<TalentFilter>("all");
  const [page, setPage] = useState(0);

  const counts = useMemo(() => {
    const next = { all: items.length, active: 0, invited: 0, record: 0 };
    for (const item of items) {
      next[item.status] += 1;
    }
    return next;
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === (filter as TalentStatus));
  }, [filter, items]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  const pills = FILTERS.map((item) => ({
    id: item.id,
    label: item.label,
    count: counts[item.id],
  }));

  function onFilterChange(id: string) {
    setFilter(id as TalentFilter);
    setPage(0);
  }

  return (
    <div className={className}>
      <FilterPills items={pills} value={filter} onChange={onFilterChange} />

      <div className="mt-4 overflow-hidden rounded-card border border-card-border bg-card shadow-card">
        <div
          className={`hidden gap-3 border-b border-card-border bg-background/70 px-4 py-3 lg:grid ${COLUMNS}`}
        >
          {[
            "Talent",
            "Status",
            "Platforms",
            "Community",
            "Live deals",
            "Outstanding",
            "Last activity",
            "",
          ].map((label) => (
            <Text key={label || "action"} variant="caption" className="truncate">
              {label}
            </Text>
          ))}
        </div>

        {visible.length > 0 ? (
          visible.map((talent) => <TalentRow key={talent.id} talent={talent} />)
        ) : (
          <div className="px-4 py-8 text-center">
            <Text variant="description">
              {items.length === 0
                ? "No talent yet. Add a record, or invite someone onto Creator Assist."
                : "No talent in this filter."}
            </Text>
          </div>
        )}
      </div>

      <Pagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
        className="mt-3"
      />
    </div>
  );
}
