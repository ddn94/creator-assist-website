import { convertAmount } from "@/lib/fx";
import type { PnlDateFilter } from "@/lib/pnlRange";
import { dateInPnlRange, resolvePnlBounds } from "@/lib/pnlRange";
import type {
  PnlBrandRow,
  PnlCurrencySummary,
  PnlTalentRow,
  TalentPnlBreakdownRow,
  TalentPnlContentRow,
  TalentPnlSummary,
} from "@/lib/pnl";
import {
  DEAL_STATUS_LABELS,
  computeDealStatus,
  fmtMoney,
  type TrackerDetail,
} from "@/lib/tracker";

function dealInPnlRange(
  item: TrackerDetail,
  start: Date | null,
  end: Date | null,
): boolean {
  if (!item.deal) return false;
  return (
    dateInPnlRange(item.updatedAt, start, end) ||
    (!!item.deal.datePaid && dateInPnlRange(item.deal.datePaid, start, end)) ||
    (!!item.deal.dateInvoiced &&
      dateInPnlRange(item.deal.dateInvoiced, start, end))
  );
}

export function buildTalentPnlRows(
  items: TrackerDetail[],
  filter?: PnlDateFilter,
  today = filter?.today ?? new Date(),
): TalentPnlContentRow[] {
  const { start, end } = resolvePnlBounds(
    filter ? { ...filter, today } : undefined,
  );

  return items
    .filter((item) => item.deal || item.expenses.length > 0)
    .map((item) => {
      const expenses = item.expenses
        .filter((e) => dateInPnlRange(e.date, start, end))
        .reduce((sum, e) => sum + e.amount, 0);
      const fee = item.deal?.feeAgreed ?? null;
      const dealStatus = item.deal ? computeDealStatus(item.deal, today) : null;
      const active =
        (!start && !end) ||
        dateInPnlRange(item.updatedAt, start, end) ||
        (!!item.deal?.datePaid &&
          dateInPnlRange(item.deal.datePaid, start, end)) ||
        item.expenses.some((e) => dateInPnlRange(e.date, start, end));
      return {
        id: item.id,
        contentId: item.id,
        title: item.title,
        type: item.type,
        brand: item.brandName,
        niche: item.niche,
        paymentStatus: dealStatus,
        paymentLabel: dealStatus ? DEAL_STATUS_LABELS[dealStatus] : null,
        fee,
        expenses,
        profit: (fee ?? 0) - expenses,
        active,
      };
    })
    .filter((row) => row.active)
    .map(({ active: _a, ...row }) => {
      void _a;
      return row;
    });
}

function breakdownBy(
  rows: TalentPnlContentRow[],
  key: (row: TalentPnlContentRow) => string | null,
): TalentPnlBreakdownRow[] {
  const map = new Map<string, { fee: number; expenses: number }>();
  for (const row of rows) {
    const name = key(row);
    if (!name) continue;
    const cur = map.get(name) ?? { fee: 0, expenses: 0 };
    cur.fee += row.fee ?? 0;
    cur.expenses += row.expenses;
    map.set(name, cur);
  }
  return [...map.entries()]
    .map(([name, value]) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      fee: value.fee,
      expenses: value.expenses,
      profit: value.fee - value.expenses,
    }))
    .sort((a, b) => b.profit - a.profit);
}

export function buildTalentPnlByBrand(
  items: TrackerDetail[],
  filter?: PnlDateFilter,
) {
  return breakdownBy(buildTalentPnlRows(items, filter), (row) => row.brand);
}

export function buildTalentPnlByNiche(
  items: TrackerDetail[],
  filter?: PnlDateFilter,
) {
  return breakdownBy(buildTalentPnlRows(items, filter), (row) => row.niche);
}

export function buildTalentPnlSummary(
  items: TrackerDetail[],
  filter?: PnlDateFilter,
  today = filter?.today ?? new Date(),
): TalentPnlSummary {
  const { start, end } = resolvePnlBounds(
    filter ? { ...filter, today } : undefined,
  );
  const revenue = items.reduce((sum, item) => {
    if (!item.deal?.datePaid) return sum;
    if (!dateInPnlRange(item.deal.datePaid, start, end)) return sum;
    return sum + item.deal.feeAgreed;
  }, 0);
  const expenses = items.reduce(
    (sum, item) =>
      sum +
      item.expenses
        .filter((e) => dateInPnlRange(e.date, start, end))
        .reduce((s, e) => s + e.amount, 0),
    0,
  );
  const overdue = items.filter(
    (item) => item.deal && computeDealStatus(item.deal, today) === "overdue",
  ).length;
  return { revenue, expenses, net: revenue - expenses, overdue };
}

export function buildAgencyPnlTalent(
  rows: {
    content: TrackerDetail;
    talentName: string;
    currency: string;
    talentId: string;
  }[],
  homeCurrency: string,
  filter?: PnlDateFilter,
): PnlTalentRow[] {
  const { start, end, today } = resolvePnlBounds(filter);
  const home = homeCurrency || "USD";
  const byTalent = new Map<
    string,
    { name: string; currency: string; items: TrackerDetail[] }
  >();

  for (const row of rows) {
    const cur = byTalent.get(row.talentId) ?? {
      name: row.talentName,
      currency: row.currency,
      items: [],
    };
    cur.items.push(row.content);
    byTalent.set(row.talentId, cur);
  }

  const result: PnlTalentRow[] = [];
  for (const [id, group] of byTalent) {
    const items = group.items.filter(
      (i) =>
        i.deal && i.type === "paid_collab" && dealInPnlRange(i, start, end),
    );
    const toHome = (fee: number) =>
      convertAmount(fee, group.currency || "USD", home);
    const billed = items.reduce((s, i) => s + toHome(i.deal?.feeAgreed ?? 0), 0);
    if (billed === 0) continue;
    const received = items
      .filter(
        (i) =>
          i.deal?.datePaid && dateInPnlRange(i.deal.datePaid, start, end),
      )
      .reduce((s, i) => s + toHome(i.deal?.feeAgreed ?? 0), 0);
    const outstanding = billed - received;
    const overdue = items
      .filter((i) => i.deal && computeDealStatus(i.deal, today) === "overdue")
      .reduce((s, i) => s + toHome(i.deal?.feeAgreed ?? 0), 0);
    result.push({
      id,
      name: group.name,
      currency: home,
      billed: fmtMoney(billed, home),
      received: fmtMoney(received, home),
      outstanding: fmtMoney(outstanding, home),
      overdue: overdue > 0 ? fmtMoney(overdue, home) : null,
    });
  }
  return result;
}

export function buildAgencyPnlBrands(
  rows: { content: TrackerDetail; currency: string }[],
  homeCurrency: string,
  filter?: PnlDateFilter,
): PnlBrandRow[] {
  const { start, end } = resolvePnlBounds(filter);
  const home = homeCurrency || "USD";
  const map = new Map<string, { name: string; amount: number }>();
  for (const { content, currency } of rows) {
    if (!content.deal || !content.brandName) continue;
    if (!dealInPnlRange(content, start, end)) continue;
    const key = content.brandName.toLowerCase();
    const cur = map.get(key) ?? { name: content.brandName, amount: 0 };
    cur.amount += convertAmount(
      content.deal.feeAgreed,
      currency || "USD",
      home,
    );
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([id, value]) => ({ id, name: value.name, amount: value.amount }))
    .sort((a, b) => b.amount - a.amount)
    .map(({ id, name, amount }) => ({
      id,
      name,
      value: fmtMoney(amount, home),
    }));
}

export function buildAgencyPnlCurrencies(
  rows: { content: TrackerDetail; currency: string }[],
  homeCurrency: string,
  filter?: PnlDateFilter,
): PnlCurrencySummary[] {
  const { start, end, today } = resolvePnlBounds(filter);
  const home = homeCurrency || "USD";
  const talentIds = new Set<string>();
  let billed = 0;
  let received = 0;
  let overdue = 0;

  for (const { content, currency } of rows) {
    if (!content.deal || content.type !== "paid_collab") continue;
    if (!dealInPnlRange(content, start, end)) continue;
    talentIds.add(content.creatorId || content.talentRecordId || content.id);
    const fee = convertAmount(content.deal.feeAgreed, currency || "USD", home);
    billed += fee;
    if (
      content.deal.datePaid &&
      dateInPnlRange(content.deal.datePaid, start, end)
    ) {
      received += fee;
    }
    if (computeDealStatus(content.deal, today) === "overdue") {
      overdue += fee;
    }
  }

  const outstanding = billed - received;
  return [
    {
      id: home.toLowerCase(),
      name: home,
      talentCount: talentIds.size,
      metrics: [
        { label: "Billed", value: fmtMoney(billed, home), tone: "idea" },
        { label: "Received", value: fmtMoney(received, home), tone: "collab" },
        {
          label: "Outstanding",
          value: fmtMoney(outstanding, home),
          tone: "payment",
        },
        {
          label: "Overdue",
          value: overdue > 0 ? fmtMoney(overdue, home) : "—",
          tone: overdue > 0 ? "organic" : "background",
          emphasize: overdue > 0,
        },
      ],
    },
  ];
}
