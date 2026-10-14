import { convertOnDate, moneyCode, type RateBook, EMPTY_RATE_BOOK } from "@/lib/fx";
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
import type { TalentStatus } from "@/lib/talent";
import {
  DEAL_STATUS_LABELS,
  computeDealStatus,
  computeDueDate,
  fmtMoney,
  type TrackerDetail,
} from "@/lib/tracker";

function paidFeeInRange(
  item: TrackerDetail,
  start: Date | null,
  end: Date | null,
): number {
  if (!item.deal?.datePaid) return 0;
  if (!dateInPnlRange(item.deal.datePaid, start, end)) return 0;
  return item.deal.feeAgreed;
}

function rateDay(value: string | null | undefined): string {
  return (value ?? "").slice(0, 10);
}

function expensesInHome(
  item: TrackerDetail,
  start: Date | null,
  end: Date | null,
  fallback: string,
  home: string,
  rates: RateBook,
): number {
  const dealCode = moneyCode(item.deal?.currency, fallback);
  return item.expenses
    .filter((expense) => dateInPnlRange(expense.date, start, end))
    .reduce(
      (sum, expense) =>
        sum +
        convertOnDate(
          expense.amount,
          moneyCode(expense.currency, dealCode),
          home,
          rateDay(expense.date),
          rates,
        ),
      0,
    );
}

function paidFeeInHome(
  item: TrackerDetail,
  start: Date | null,
  end: Date | null,
  fallback: string,
  home: string,
  rates: RateBook,
): number {
  const paid = paidFeeInRange(item, start, end);
  if (!paid) return 0;
  return convertOnDate(
    paid,
    moneyCode(item.deal?.currency, fallback),
    home,
    rateDay(item.deal?.datePaid),
    rates,
  );
}

function overdueInRange(
  item: TrackerDetail,
  start: Date | null,
  end: Date | null,
  today: Date,
  timeZone?: string | null,
): boolean {
  if (
    !item.deal ||
    computeDealStatus(item.deal, today, timeZone) !== "overdue"
  ) {
    return false;
  }
  return dateInPnlRange(computeDueDate(item.deal, timeZone), start, end);
}

export function buildTalentPnlRows(
  items: TrackerDetail[],
  filter?: PnlDateFilter,
  today = filter?.today ?? new Date(),
  currency = "USD",
  rates: RateBook = EMPTY_RATE_BOOK,
  timeZone?: string | null,
): TalentPnlContentRow[] {
  const { start, end } = resolvePnlBounds(
    filter ? { ...filter, today } : undefined,
  );
  const home = moneyCode(currency);

  return items
    .filter((item) => item.deal || item.expenses.length > 0)
    .map((item) => {
      const code = moneyCode(
        item.deal?.currency,
        moneyCode(
          item.expenses.find((expense) => expense.currency)?.currency,
          home,
        ),
      );
      const expenses = item.expenses
        .filter((e) => dateInPnlRange(e.date, start, end))
        .reduce(
          (sum, e) =>
            sum +
            convertOnDate(
              e.amount,
              moneyCode(e.currency, code),
              home,
              rateDay(e.date),
              rates,
            ),
          0,
        );
      const feeRaw = item.deal ? paidFeeInRange(item, start, end) : null;
      const fee =
        feeRaw == null
          ? null
          : convertOnDate(feeRaw, code, home, rateDay(item.deal?.datePaid), rates);
      const dealStatus = item.deal
        ? computeDealStatus(item.deal, today, timeZone)
        : null;
      const active =
        (!start && !end) ||
        (!!item.deal?.datePaid &&
          dateInPnlRange(item.deal.datePaid, start, end)) ||
        (!!item.deal?.dateInvoiced &&
          dateInPnlRange(item.deal.dateInvoiced, start, end)) ||
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
        currency: home,
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

function rowsInReportCurrency(
  items: TrackerDetail[],
  filter: PnlDateFilter | undefined,
  currency: string,
  rates: RateBook,
  timeZone?: string | null,
): TalentPnlContentRow[] {
  return buildTalentPnlRows(
    items,
    filter,
    filter?.today,
    currency,
    rates,
    timeZone,
  );
}

export function buildTalentPnlByBrand(
  items: TrackerDetail[],
  filter?: PnlDateFilter,
  currency = "USD",
  rates: RateBook = EMPTY_RATE_BOOK,
  timeZone?: string | null,
) {
  return breakdownBy(
    rowsInReportCurrency(items, filter, currency, rates, timeZone),
    (row) => row.brand,
  );
}

export function buildTalentPnlByNiche(
  items: TrackerDetail[],
  filter?: PnlDateFilter,
  currency = "USD",
  rates: RateBook = EMPTY_RATE_BOOK,
  timeZone?: string | null,
) {
  return breakdownBy(
    rowsInReportCurrency(items, filter, currency, rates, timeZone),
    (row) => row.niche,
  );
}

export function buildTalentPnlSummary(
  items: TrackerDetail[],
  filter?: PnlDateFilter,
  today = filter?.today ?? new Date(),
  currency = "USD",
  rates: RateBook = EMPTY_RATE_BOOK,
  timeZone?: string | null,
): TalentPnlSummary {
  const { start, end } = resolvePnlBounds(
    filter ? { ...filter, today } : undefined,
  );
  const home = moneyCode(currency);
  const revenue = items.reduce((sum, item) => {
    if (!item.deal?.datePaid) return sum;
    if (!dateInPnlRange(item.deal.datePaid, start, end)) return sum;
    return (
      sum +
      convertOnDate(
        item.deal.feeAgreed,
        moneyCode(item.deal.currency, home),
        home,
        rateDay(item.deal.datePaid),
        rates,
      )
    );
  }, 0);
  const expenses = items.reduce((sum, item) => {
    const fallback = moneyCode(item.deal?.currency, home);
    return (
      sum +
      item.expenses
        .filter((e) => dateInPnlRange(e.date, start, end))
        .reduce(
          (s, e) =>
            s +
            convertOnDate(
              e.amount,
              moneyCode(e.currency, fallback),
              home,
              rateDay(e.date),
              rates,
            ),
          0,
        )
    );
  }, 0);
  const overdue = items.filter((item) =>
    overdueInRange(item, start, end, today, timeZone),
  ).length;
  return { revenue, expenses, net: revenue - expenses, overdue, currency: home };
}

export function buildAgencyPnlTalent(
  rows: {
    content: TrackerDetail;
    talentName: string;
    currency: string;
    talentId: string;
    recordStatus?: TalentStatus;
  }[],
  homeCurrency: string,
  filter?: PnlDateFilter,
  rates: RateBook = EMPTY_RATE_BOOK,
): PnlTalentRow[] {
  const { start, end } = resolvePnlBounds(filter);
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

  const result: {
    id: string;
    name: string;
    currency: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[] = [];
  for (const [id, group] of byTalent) {
    const fallback = group.currency || "USD";
    const revenue = group.items.reduce(
      (sum, item) => sum + paidFeeInHome(item, start, end, fallback, home, rates),
      0,
    );
    const expenses = group.items.reduce(
      (sum, item) => sum + expensesInHome(item, start, end, fallback, home, rates),
      0,
    );
    if (revenue === 0 && expenses === 0) continue;
    result.push({
      id,
      name: group.name,
      currency: home,
      revenue,
      expenses,
      profit: revenue - expenses,
    });
  }
  return result
    .sort((a, b) => b.profit - a.profit)
    .map((row) => ({
      id: row.id,
      name: row.name,
      currency: row.currency,
      revenue: fmtMoney(row.revenue, home),
      expenses: fmtMoney(row.expenses, home),
      profit: fmtMoney(row.profit, home),
    }));
}

export function buildAgencyPnlBrands(
  rows: {
    content: TrackerDetail;
    currency: string;
    recordStatus?: TalentStatus;
  }[],
  homeCurrency: string,
  filter?: PnlDateFilter,
  rates: RateBook = EMPTY_RATE_BOOK,
): PnlBrandRow[] {
  const { start, end } = resolvePnlBounds(filter);
  const home = homeCurrency || "USD";
  const map = new Map<string, { name: string; profit: number }>();
  for (const { content, currency } of rows) {
    if (!content.brandName) continue;
    const fallback = currency || "USD";
    const paid = paidFeeInHome(content, start, end, fallback, home, rates);
    const cost = expensesInHome(content, start, end, fallback, home, rates);
    if (paid === 0 && cost === 0) continue;
    const key = content.brandName.toLowerCase();
    const cur = map.get(key) ?? { name: content.brandName, profit: 0 };
    cur.profit += paid - cost;
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([id, value]) => ({ id, name: value.name, profit: value.profit }))
    .sort((a, b) => b.profit - a.profit)
    .map(({ id, name, profit }) => ({
      id,
      name,
      value: fmtMoney(profit, home),
      negative: profit < 0,
    }));
}

export function buildAgencyPnlCurrencies(
  rows: {
    content: TrackerDetail;
    currency: string;
    talentId?: string;
    recordStatus?: TalentStatus;
  }[],
  homeCurrency: string,
  filter?: PnlDateFilter,
  rates: RateBook = EMPTY_RATE_BOOK,
  timeZone?: string | null,
): PnlCurrencySummary[] {
  const { start, end, today } = resolvePnlBounds(filter);
  const home = homeCurrency || "USD";
  const talentIds = new Set<string>();
  let revenue = 0;
  let expenses = 0;
  let overdue = 0;

  for (const { content, currency, talentId } of rows) {
    const fallback = currency || "USD";
    const paid = paidFeeInHome(content, start, end, fallback, home, rates);
    const cost = expensesInHome(content, start, end, fallback, home, rates);
    if (paid !== 0 || cost !== 0) {
      talentIds.add(talentId || content.creatorId || content.id);
    }
    revenue += paid;
    expenses += cost;
    if (overdueInRange(content, start, end, today, timeZone)) overdue += 1;
  }

  const net = revenue - expenses;
  return [
    {
      id: home.toLowerCase(),
      name: home,
      talentCount: talentIds.size,
      metrics: [
        { label: "Total revenue", value: fmtMoney(revenue, home), tone: "collab" },
        { label: "Total expenses", value: fmtMoney(expenses, home), tone: "payment" },
        {
          label: "Net profit",
          value: fmtMoney(net, home),
          tone: "collab",
          valueClassName: net < 0 ? "text-danger!" : "text-primary-hover!",
        },
        {
          label: "Overdue",
          value: String(overdue),
          tone: overdue > 0 ? "organic" : "background",
          emphasize: overdue > 0,
        },
      ],
    },
  ];
}
