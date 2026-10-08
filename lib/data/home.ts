import {
  addCalendarDays,
  calendarDay,
  calendarDayInZone,
} from "@/lib/calendarDay";
import type { TalentStatus } from "@/lib/talent";
import type { Category } from "@/lib/ui";
import { convertAmount, moneyCode, totalInCurrency } from "@/lib/fx";
import type { IdeaItem } from "@/lib/ideas";
import { toDateInput } from "@/lib/timestamps";
import {
  STAGE_LABELS,
  attentionDetail,
  computeDealStatus,
  computeDueDate,
  contentCategory,
  fmtMoney,
  type Stage,
  type TrackerDetail,
} from "@/lib/tracker";

export type AttentionItem = {
  id: string;
  name: string;
  project: string;
  detail: string;
  amount: string;
  overdue?: boolean;
};

export type OverviewStats = {
  inProgress: number;
  paymentsDue: number;
  revenue: string;
  dueThisWeek: string;
};

export type ContinueFeedItem = {
  id: string;
  title: string;
  category: Category;
  pill: string;
  meta: string;
  href: string;
};

export function buildOverviewStats(
  items: TrackerDetail[],
  currency: string,
  today = new Date(),
  timeZone?: string | null,
): OverviewStats {
  const inProgress = items.filter((item) => item.stage !== "go_live").length;
  const deals = items.filter((item) => item.deal).map((item) => item.deal!);
  const paymentsDue = deals.filter((d) => d.dateInvoiced && !d.datePaid).length;
  const revenue = totalInCurrency(
    deals
      .filter((d) => d.datePaid)
      .map((d) => ({ amount: d.feeAgreed, currency: d.currency })),
    currency,
  );

  const todayIso = timeZone
    ? calendarDayInZone(today, timeZone)
    : calendarDay(today);
  const weekEnd = addCalendarDays(todayIso, 7);

  const dueDeals = deals.filter((d) => {
    if (d.datePaid) return false;
    const due = computeDueDate(d, timeZone);
    if (!due) return false;
    return due >= todayIso && due <= weekEnd;
  });
  const dueThisWeek = totalInCurrency(
    dueDeals.map((d) => ({ amount: d.feeAgreed, currency: d.currency })),
    currency,
  );

  return {
    inProgress,
    paymentsDue,
    revenue: fmtMoney(revenue.amount, revenue.currency),
    dueThisWeek: fmtMoney(dueThisWeek.amount, dueThisWeek.currency),
  };
}

export function buildContinueFeed(
  items: TrackerDetail[],
  ideas: IdeaItem[],
  limit = 4,
): ContinueFeedItem[] {
  const contentFeed = items.map((item) => ({
    kind: "content" as const,
    date: item.updatedAt,
    id: item.id,
    title: item.title,
    category: contentCategory(item.type),
    pill: item.type === "paid_collab" ? "Paid collab" : "Organic",
    meta: `${STAGE_LABELS[item.stage as Stage] ?? item.stage} · ${item.platform}`,
    href: `/overview/tracker/${item.id}`,
  }));

  const ideaFeed = ideas
    .filter((idea) => idea.status !== "used")
    .map((idea) => ({
      kind: "idea" as const,
      date: idea.createdAt,
      id: idea.id,
      title: idea.title,
      category: "idea" as Category,
      pill: "Idea",
      meta:
        idea.tags.slice(0, 2).join(" · ") ||
        (idea.body.trim()
          ? idea.body.trim().length > 48
            ? `${idea.body.trim().slice(0, 48)}…`
            : idea.body.trim()
          : "No tags"),
      href: "/overview/ideas",
    }));

  return [...contentFeed, ...ideaFeed]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map(({ kind, date, ...item }) => {
      void kind;
      void date;
      return item;
    });
}

export function buildAgencyOverviewMoney(
  rows: {
    content: TrackerDetail;
    currency: string;
    recordStatus?: TalentStatus;
  }[],
  homeCurrency: string,
  today = new Date(),
  timeZone?: string | null,
) {
  const home = homeCurrency || "USD";
  let outstanding = 0;
  let overdue = 0;
  let received = 0;
  const todayIso = timeZone
    ? calendarDayInZone(today, timeZone)
    : calendarDay(today);
  const monthStart = `${todayIso.slice(0, 7)}-01`;

  for (const { content, currency } of rows) {
    if (!content.deal || content.type !== "paid_collab") continue;
    const fee = convertAmount(
      content.deal.feeAgreed,
      moneyCode(content.deal.currency, currency || "USD"),
      home,
    );
    const status = computeDealStatus(content.deal, today, timeZone);
    if (!content.deal.datePaid) {
      outstanding += fee;
      if (status === "overdue") overdue += fee;
    } else if (
      content.deal.datePaid &&
      (toDateInput(content.deal.datePaid, timeZone) ||
        content.deal.datePaid.slice(0, 10)) >= monthStart
    ) {
      received += fee;
    }
  }

  return {
    outstanding: fmtMoney(outstanding, home),
    overdue: fmtMoney(overdue, home),
    received: fmtMoney(received, home),
    outstandingFooter: "Across live deals",
    overdueFooter: overdue > 0 ? "Needs follow-up" : "None overdue",
    receivedFooter: "Across all talent",
  };
}

export function buildAgencyAttention(
  rows: {
    content: TrackerDetail;
    talentName: string;
    currency: string;
    recordStatus?: TalentStatus;
  }[],
  today = new Date(),
  timeZone?: string | null,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const { content, talentName, currency } of rows) {
    if (!content.deal || content.type !== "paid_collab") continue;
    const status = computeDealStatus(content.deal, today, timeZone);
    const fee = fmtMoney(
      content.deal.feeAgreed,
      moneyCode(content.deal.currency, currency || "USD"),
    );
    const due = computeDueDate(content.deal, timeZone);

    const detail = attentionDetail(status, {
      dueIso: due,
      deliveredIso: content.deal.dateDelivered
        ? toDateInput(content.deal.dateDelivered, timeZone) ||
        content.deal.dateDelivered
        : null,
      today,
    });
    if (!detail) continue;
    items.push({
      id: content.id,
      name: talentName,
      project: content.title,
      detail,
      amount: fee,
      overdue: status === "overdue",
    });
  }

  return items.sort((a, b) => Number(b.overdue) - Number(a.overdue));
}
