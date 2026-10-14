"use client";

import { useMemo, useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { FilterPills } from "@/components/FilterPills";
import { Text } from "@/components/Text";
import type { WaitlistEntry } from "@/lib/data/waitlist";

const PAGE_SIZE = 20;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "used", label: "Used" },
] as const;

type WaitlistFilter = (typeof FILTERS)[number]["id"];

type WaitlistTableProps = {
  items: WaitlistEntry[];
  className?: string;
};

const COLUMNS =
  "grid-cols-[minmax(12rem,1.4fr)_minmax(8rem,1fr)_7rem_minmax(7rem,1fr)_5.5rem]";

function formatJoined(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers / denied clipboard
      const input = document.createElement("textarea");
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-background"
      aria-label={copied ? "Copied" : `Copy invite code ${code}`}
    >
      {copied ? (
        <CheckIcon size={14} weight="bold" aria-hidden />
      ) : (
        <CopyIcon size={14} weight="bold" aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function WaitlistTable({ items, className = "" }: WaitlistTableProps) {
  const [filter, setFilter] = useState<WaitlistFilter>("all");
  const [page, setPage] = useState(0);

  const counts = useMemo(() => {
    const next = { all: items.length, pending: 0, used: 0 };
    for (const item of items) {
      if (item.consumedAt) next.used += 1;
      else next.pending += 1;
    }
    return next;
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "pending") return items.filter((item) => !item.consumedAt);
    if (filter === "used") return items.filter((item) => !!item.consumedAt);
    return items;
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

  return (
    <div className={className}>
      <FilterPills
        items={pills}
        value={filter}
        onChange={(id) => {
          setFilter(id as WaitlistFilter);
          setPage(0);
        }}
      />

      <div className="mt-4 overflow-hidden rounded-card border border-card-border bg-card shadow-card">
        <div
          className={`hidden gap-3 border-b border-card-border bg-background/70 px-4 py-3 md:grid ${COLUMNS}`}
        >
          {["Email", "Invite code", "Status", "Joined", ""].map((label) => (
            <Text key={label || "action"} variant="caption" className="truncate">
              {label}
            </Text>
          ))}
        </div>

        {visible.length > 0 ? (
          visible.map((row) => {
            const used = !!row.consumedAt;
            return (
              <div
                key={row.id}
                className="border-b border-card-border last:border-b-0"
              >
                {/* Mobile */}
                <div className="space-y-2 px-4 py-3.5 md:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <Text variant="cardTitle" className="min-w-0 break-all text-sm">
                      {row.email}
                    </Text>
                    <Text
                      variant="caption"
                      className={used ? "text-muted" : "text-ink"}
                    >
                      {used ? "Used" : "Pending"}
                    </Text>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Text
                      variant="caption"
                      className="font-mono text-ink tracking-wide"
                    >
                      {row.inviteCode}
                    </Text>
                    <CopyCodeButton code={row.inviteCode} />
                  </div>
                  <Text variant="caption">{formatJoined(row.createdAt)}</Text>
                </div>

                {/* Desktop */}
                <div
                  className={`hidden items-center gap-3 px-4 py-3.5 md:grid ${COLUMNS}`}
                >
                  <Text variant="cardTitle" className="truncate text-sm">
                    {row.email}
                  </Text>
                  <Text
                    variant="caption"
                    className="font-mono tracking-wide text-ink"
                  >
                    {row.inviteCode}
                  </Text>
                  <Text variant="caption" className="text-ink">
                    {used ? "Used" : "Pending"}
                  </Text>
                  <Text variant="caption" className="text-ink">
                    {formatJoined(row.createdAt)}
                  </Text>
                  <div className="justify-self-end">
                    <CopyCodeButton code={row.inviteCode} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-4 py-8 text-center">
            <Text variant="description">
              {items.length === 0
                ? "No one on the waitlist yet."
                : "No entries in this filter."}
            </Text>
          </div>
        )}
      </div>

      {filtered.length > PAGE_SIZE ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <Text variant="caption">
            Page {currentPage + 1} of {totalPages}
          </Text>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
