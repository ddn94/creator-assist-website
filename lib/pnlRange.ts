export type PnlRangeKind = "all" | "last30" | "year" | "custom";

export type PnlDateFilter = {
  range: PnlRangeKind;
  from?: string;
  to?: string;
  today?: Date;
};

export const PNL_PERIODS = [
  { id: "all" as const, label: "All time" },
  { id: "last30" as const, label: "Last 30 days" },
  { id: "year" as const, label: "This year" },
  { id: "custom" as const, label: "Custom" },
];

export type PnlPeriod = (typeof PNL_PERIODS)[number]["id"];

function parseDay(s: string | undefined, endOfDay = false): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(s + (endOfDay ? "T23:59:59.999" : "T00:00:00"));
}

function toDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Bounds for each top-level period; custom may be unbounded. */
export function pnlBounds(
  range: PnlRangeKind,
  from?: string,
  to?: string,
  today = new Date(),
): { start: Date | null; end: Date | null } {
  if (range === "all") {
    return { start: null, end: null };
  }
  if (range === "last30") {
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 30);
    return { start, end: null };
  }
  if (range === "year") {
    return { start: new Date(today.getFullYear(), 0, 1), end: null };
  }
  return { start: parseDay(from), end: parseDay(to, true) };
}

export function dateInPnlRange(
  d: Date | string | null | undefined,
  start: Date | null,
  end: Date | null,
): boolean {
  if (d == null || d === "") return !start && !end;
  const date =
    typeof d === "string"
      ? new Date(d.includes("T") ? d : `${d}T12:00:00`)
      : d;
  if (Number.isNaN(date.getTime())) return !start && !end;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

export function resolvePnlBounds(filter?: PnlDateFilter): {
  start: Date | null;
  end: Date | null;
  today: Date;
} {
  const today = filter?.today ?? new Date();
  if (!filter) return { start: null, end: null, today };
  const { start, end } = pnlBounds(
    filter.range,
    filter.from,
    filter.to,
    today,
  );
  return { start, end, today };
}

export { toDay };
