export type PnlRangeKind = "month" | "quarter" | "year" | "custom";

export type PnlDateFilter = {
  range: PnlRangeKind;
  from?: string;
  to?: string;
  today?: Date;
};

export const PNL_PERIODS = [
  { id: "month" as const, label: "This month" },
  { id: "quarter" as const, label: "This quarter" },
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

export function pnlCustomPresets(today = new Date()) {
  const last30 = new Date(today);
  last30.setDate(last30.getDate() - 30);
  const yearStart = new Date(today.getFullYear(), 0, 1);
  return [
    { label: "All time", from: "", to: "" },
    { label: "Last 30 days", from: toDay(last30), to: "" },
    { label: "This year", from: toDay(yearStart), to: "" },
  ] as const;
}

/** Bounds match old /dashboard: month/quarter/year open-ended end; custom may be unbounded. */
export function pnlBounds(
  range: PnlRangeKind,
  from?: string,
  to?: string,
  today = new Date(),
): { start: Date | null; end: Date | null } {
  if (range === "month") {
    return {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: null,
    };
  }
  if (range === "quarter") {
    const q = Math.floor(today.getMonth() / 3);
    return {
      start: new Date(today.getFullYear(), q * 3, 1),
      end: null,
    };
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
