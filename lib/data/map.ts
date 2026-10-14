import type {
  ContentType,
  PaymentTerms,
  Stage,
  TrackerDeal,
  TrackerDeliverable,
  TrackerDetail,
  TrackerExpense,
  TrackerItem,
} from "@/lib/tracker";
import type { IdeaItem, IdeaStatus } from "@/lib/ideas";
import { toDateInput } from "@/lib/timestamps";

export type ContentRow = {
  id: string;
  owner_id: string | null;
  talent_record_id?: string | null;
  agency_created?: boolean | null;
  title: string;
  platform: string;
  niche: string | null;
  type: string;
  brand_name: string | null;
  stage: string;
  go_live_date: string | null;
  shot_list: string;
  notes: string;
  idea_title: string | null;
  fee_agreed: number | string | null;
  currency?: string | null;
  payment_terms: string | null;
  date_delivered: string | null;
  date_invoiced: string | null;
  date_paid: string | null;
  created_at: string;
  updated_at: string;
  content_deliverables?: DeliverableRow[] | null;
  content_expenses?: ExpenseRow[] | null;
};

export type DeliverableRow = {
  id: string;
  content_id: string;
  type: string;
  quantity: number;
  rate: number | string;
  sort_order: number;
};

export type ExpenseRow = {
  id: string;
  content_id: string;
  category: string;
  amount: number | string;
  note: string | null;
  expense_date: string;
  sort_order: number;
  currency?: string | null;
};

export type IdeaRow = {
  id: string;
  owner_id: string;
  title: string;
  body: string;
  tags: string[] | null;
  status: string;
  linked_content_id: string | null;
  created_at: string;
};

function num(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value !== "") return Number(value) || 0;
  return 0;
}

function dateOnly(
  value: string | null | undefined,
  timeZone?: string | null,
): string | null {
  if (!value) return null;
  return toDateInput(value, timeZone) || value.slice(0, 10);
}

function mapDeliverable(row: DeliverableRow): TrackerDeliverable {
  return {
    id: row.id,
    type: row.type as TrackerDeliverable["type"],
    quantity: row.quantity,
    rate: num(row.rate),
  };
}

function mapExpense(
  row: ExpenseRow,
  timeZone?: string | null,
): TrackerExpense {
  return {
    id: row.id,
    category: row.category as TrackerExpense["category"],
    amount: num(row.amount),
    note: row.note,
    date: dateOnly(row.expense_date, timeZone) ?? row.expense_date,
    currency: row.currency?.trim() || null,
  };
}

function mapDeal(row: ContentRow): TrackerDeal | null {
  if (row.type !== "paid_collab") return null;
  return {
    feeAgreed: num(row.fee_agreed),
    paymentTerms: (row.payment_terms as PaymentTerms) || "net_30",
    dateDelivered: row.date_delivered,
    dateInvoiced: row.date_invoiced,
    datePaid: row.date_paid,
    currency: row.currency?.trim() || null,
    deliverables: (row.content_deliverables ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapDeliverable),
  };
}

export function mapContent(
  row: ContentRow,
  timeZone?: string | null,
): TrackerDetail {
  return {
    id: row.id,
    creatorId: row.owner_id ?? "",
    talentRecordId: row.talent_record_id ?? null,
    agencyCreated: row.agency_created === true,
    title: row.title,
    platform: row.platform,
    niche: row.niche,
    type: row.type as ContentType,
    brandName: row.brand_name,
    stage: row.stage as Stage,
    goLiveDate: row.go_live_date,
    shotList: row.shot_list ?? "",
    notes: row.notes ?? "",
    deal: mapDeal(row),
    expenses: (row.content_expenses ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((expense) => mapExpense(expense, timeZone)),
    ideaTitle: row.idea_title,
    createdAt: dateOnly(row.created_at, timeZone) ?? row.created_at.slice(0, 10),
    updatedAt: dateOnly(row.updated_at, timeZone) ?? row.updated_at.slice(0, 10),
    createdAtIso: row.created_at,
    updatedAtIso: row.updated_at,
  };
}

export function toListItem(item: TrackerDetail): TrackerItem {
  return {
    id: item.id,
    title: item.title,
    platform: item.platform,
    niche: item.niche,
    type: item.type,
    brandName: item.brandName,
    stage: item.stage,
    goLiveDate: item.goLiveDate,
  };
}

export function mapIdea(row: IdeaRow): IdeaItem {
  return {
    id: row.id,
    creatorId: row.owner_id,
    title: row.title,
    body: row.body ?? "",
    tags: row.tags ?? [],
    status: row.status as IdeaStatus,
    createdAt: dateOnly(row.created_at) ?? row.created_at.slice(0, 10),
    linkedContentItemId: row.linked_content_id,
  };
}

export const CONTENT_SELECT = `
  *,
  content_deliverables (*),
  content_expenses (*)
`;
