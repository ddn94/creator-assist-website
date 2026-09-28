import type { Category } from "@/lib/ui";
import { convertAmount } from "@/lib/fx";
import type { IdeaItem } from "@/lib/ideas";
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
): OverviewStats {
  const inProgress = items.filter((item) => item.stage !== "go_live").length;
  const deals = items.filter((item) => item.deal).map((item) => item.deal!);
  const paymentsDue = deals.filter((d) => d.dateInvoiced && !d.datePaid).length;
  const revenue = deals
    .filter((d) => d.datePaid)
    .reduce((sum, d) => sum + d.feeAgreed, 0);

  const todayIso = today.toISOString().slice(0, 10);
  const todayDate = new Date(`${todayIso}T12:00:00`);
  const weekAhead = new Date(todayDate);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const dueThisWeek = deals
    .filter((d) => {
      if (d.datePaid) return false;
      const due = computeDueDate(d);
      if (!due) return false;
      const dueDate = new Date(`${due}T12:00:00`);
      return dueDate >= todayDate && dueDate <= weekAhead;
    })
    .reduce((sum, d) => sum + d.feeAgreed, 0);

  return {
    inProgress,
    paymentsDue,
    revenue: fmtMoney(revenue, currency),
    dueThisWeek: fmtMoney(dueThisWeek, currency),
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
    href: `/home/tracker/${item.id}`,
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
      meta: idea.tags.slice(0, 2).join(" · ") || "Untitled notes",
      href: "/home/ideas",
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
  rows: { content: TrackerDetail; currency: string }[],
  homeCurrency: string,
  today = new Date(),
) {
  const home = homeCurrency || "USD";
  let outstanding = 0;
  let overdue = 0;
  let received = 0;
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  for (const { content, currency } of rows) {
    if (!content.deal || content.type !== "paid_collab") continue;
    const fee = convertAmount(content.deal.feeAgreed, currency || "USD", home);
    const status = computeDealStatus(content.deal, today);
    if (!content.deal.datePaid) {
      outstanding += fee;
      if (status === "overdue") overdue += fee;
    } else if (
      content.deal.datePaid &&
      new Date(
        content.deal.datePaid.includes("T")
          ? content.deal.datePaid
          : `${content.deal.datePaid}T12:00:00`,
      ) >= monthStart
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
    receivedFooter: "Paid this month",
  };
}

export function buildAgencyAttention(
  rows: { content: TrackerDetail; talentName: string; currency: string }[],
  today = new Date(),
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const { content, talentName, currency } of rows) {
    if (!content.deal || content.type !== "paid_collab") continue;
    const status = computeDealStatus(content.deal, today);
    const fee = fmtMoney(content.deal.feeAgreed, currency || "USD");
    const due = computeDueDate(content.deal);

    const detail = attentionDetail(status, {
      dueIso: due,
      deliveredIso: content.deal.dateDelivered,
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
