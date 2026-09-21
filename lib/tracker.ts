import type { StatusTagTone } from "@/components/StatusTag";
import type { Category } from "@/lib/ui";

export const STAGES = [
  "concept",
  "filmed",
  "edited",
  "delivered",
  "go_live",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  concept: "Concept",
  filmed: "Filmed",
  edited: "Edited",
  delivered: "Delivered",
  go_live: "Go Live",
};

export const STAGE_OPTIONS = STAGES.map((stage) => ({
  value: stage,
  label: STAGE_LABELS[stage],
}));

export const PLATFORM_OPTIONS = [
  { value: "Instagram", label: "Instagram" },
  { value: "TikTok", label: "TikTok" },
  { value: "YouTube", label: "YouTube" },
] as const;

export const CONTENT_TYPE_OPTIONS = [
  { value: "organic", label: "Organic" },
  { value: "paid_collab", label: "Paid collab" },
] as const;

export type ContentType = (typeof CONTENT_TYPE_OPTIONS)[number]["value"];

export const PAYMENT_TERMS = ["net_30", "net_60", "net_90", "net_120"] as const;
export type PaymentTerms = (typeof PAYMENT_TERMS)[number];

export const TERM_DAYS: Record<PaymentTerms, number> = {
  net_30: 30,
  net_60: 60,
  net_90: 90,
  net_120: 120,
};

export const TERM_LABELS: Record<PaymentTerms, string> = {
  net_30: "Net 30",
  net_60: "Net 60",
  net_90: "Net 90",
  net_120: "Net 120",
};

export const PAYMENT_TERM_OPTIONS = PAYMENT_TERMS.map((term) => ({
  value: term,
  label: TERM_LABELS[term],
}));

export const EXPENSE_CATEGORIES = ["editor", "props", "travel", "other"] as const;

export const EXPENSE_CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((category) => ({
  value: category,
  label: category.charAt(0).toUpperCase() + category.slice(1),
}));

export const DELIVERABLE_TYPES = ["video", "carousel", "stories"] as const;
export type DeliverableType = (typeof DELIVERABLE_TYPES)[number];

export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  video: "Video",
  carousel: "Carousel",
  stories: "Stories",
};

export const DELIVERABLE_TYPE_OPTIONS = DELIVERABLE_TYPES.map((type) => ({
  value: type,
  label: DELIVERABLE_TYPE_LABELS[type],
}));

export type DealStatus = "not_invoiced" | "awaiting_payment" | "overdue" | "paid";

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  not_invoiced: "Not invoiced",
  awaiting_payment: "Awaiting payment",
  overdue: "Overdue",
  paid: "Paid",
};

export const dealStatusTone: Record<DealStatus, StatusTagTone> = {
  not_invoiced: "notInvoiced",
  awaiting_payment: "awaiting",
  overdue: "overdue",
  paid: "paid",
};

export type TrackerItem = {
  id: string;
  title: string;
  platform: string;
  niche: string | null;
  type: ContentType;
  brandName: string | null;
  stage: Stage;
  goLiveDate: string | null;
};

export type TrackerDeliverable = {
  id: string;
  type: DeliverableType;
  quantity: number;
  rate: number;
};

export type TrackerExpense = {
  id: string;
  category: (typeof EXPENSE_CATEGORIES)[number];
  amount: number;
  note: string | null;
  date: string;
};

export type TrackerDeal = {
  feeAgreed: number;
  paymentTerms: PaymentTerms;
  dateDelivered: string | null;
  dateInvoiced: string | null;
  datePaid: string | null;
  deliverables: TrackerDeliverable[];
};

export type TrackerDetail = TrackerItem & {
  shotList: string;
  notes: string;
  deal: TrackerDeal | null;
  expenses: TrackerExpense[];
  ideaTitle: string | null;
  updatedAt: string;
  /** Owner in the shared mock DB */
  creatorId: string;
};

export function contentCategory(type: ContentType): Category {
  return type === "paid_collab" ? "paid" : "organic";
}

export function contentPillLabel(type: ContentType): string {
  return type === "paid_collab" ? "Paid collab" : "Organic";
}

export function nextStage(stage: Stage): Stage | null {
  const index = STAGES.indexOf(stage);
  if (index < 0 || index >= STAGES.length - 1) return null;
  return STAGES[index + 1];
}

export function formatLiveDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtMoney(amount: number): string {
  return (
    "$" +
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  );
}

export function deliverablesTotal(
  deliverables: { quantity: number; rate: number }[],
): number {
  return deliverables.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

export function computeDueDate(deal: {
  paymentTerms: PaymentTerms;
  dateInvoiced: string | null;
}): string | null {
  if (!deal.dateInvoiced) return null;
  const due = new Date(`${deal.dateInvoiced}T12:00:00`);
  due.setDate(due.getDate() + (TERM_DAYS[deal.paymentTerms] ?? 30));
  return due.toISOString().slice(0, 10);
}

export function computeDealStatus(
  deal: {
    paymentTerms: PaymentTerms;
    dateInvoiced: string | null;
    datePaid: string | null;
  },
  today = new Date(),
): DealStatus {
  if (deal.datePaid) return "paid";
  const due = computeDueDate(deal);
  if (!due) return "not_invoiced";
  const dueDate = new Date(`${due}T12:00:00`);
  const todayDate = new Date(
    `${today.toISOString().slice(0, 10)}T12:00:00`,
  );
  return todayDate > dueDate ? "overdue" : "awaiting_payment";
}
