import { displayName } from "@/lib/auth/profileAnswers";
import type { Profile } from "@/lib/auth/types";
import type { TalentActivityItem } from "@/lib/talent";
import { toDateInput } from "@/lib/timestamps";
import type {
  TrackerDeliverable,
  TrackerDetail,
  TrackerExpense,
} from "@/lib/tracker";
import type { SupabaseClient } from "@supabase/supabase-js";

function day(value: string | null | undefined) {
  return toDateInput(value);
}

function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

type SavedDeliverable = {
  id: string;
  type: string;
  quantity: number;
  rate: number | string;
};

type SavedExpense = {
  id: string;
  category: string;
  amount: number | string;
  note: string | null;
  expense_date: string;
};

export type SavedContentSnapshot = {
  title: string;
  notes: string;
  type: string;
  fee_agreed: number | string | null;
  payment_terms: string | null;
  date_delivered: string | null;
  date_invoiced: string | null;
  date_paid: string | null;
  content_deliverables: SavedDeliverable[] | null;
  content_expenses: SavedExpense[] | null;
};

function isUuid(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

function deliverableChanged(previous: SavedDeliverable[], next: TrackerDeliverable[]) {
  const previousById = new Map(previous.map((row) => [row.id, row]));
  const nextIds = new Set(next.filter((row) => isUuid(row.id)).map((row) => row.id));
  const added = next.some((row) => !isUuid(row.id) || !previousById.has(row.id));
  const removed = previous.some((row) => !nextIds.has(row.id));
  const updated = next.some((row) => {
    const before = previousById.get(row.id);
    if (!before) return false;
    return (
      before.type !== row.type ||
      before.quantity !== row.quantity ||
      money(before.rate) !== money(row.rate)
    );
  });
  return { added, removed, updated };
}

function expenseChanged(previous: SavedExpense[], next: TrackerExpense[]) {
  const previousById = new Map(previous.map((row) => [row.id, row]));
  const nextIds = new Set(next.filter((row) => isUuid(row.id)).map((row) => row.id));
  const added = next.some((row) => !isUuid(row.id) || !previousById.has(row.id));
  const removed = previous.some((row) => !nextIds.has(row.id));
  const updated = next.some((row) => {
    const before = previousById.get(row.id);
    if (!before) return false;
    return (
      before.category !== row.category ||
      money(before.amount) !== money(row.amount) ||
      (before.note ?? "") !== (row.note ?? "") ||
      day(before.expense_date) !== day(row.date)
    );
  });
  return { added, removed, updated };
}

/** Lines for the fields Recent changes keeps: notes, deal, deliverables, expenses. */
export function contentChangeSummaries(
  previous: SavedContentSnapshot,
  next: TrackerDetail,
): string[] {
  const title = next.title.trim() || previous.title;
  const lines: string[] = [];
  if ((previous.notes ?? "").trim() !== (next.notes ?? "").trim()) {
    lines.push(`Updated notes on "${title}"`);
  }

  const paid = next.type === "paid_collab";
  const beforePaid = previous.type === "paid_collab";
  if (paid || beforePaid) {
    const fee = paid ? money(next.deal?.feeAgreed) : 0;
    const beforeFee = beforePaid ? money(previous.fee_agreed) : 0;
    if (fee !== beforeFee) lines.push(`Updated the fee on "${title}"`);

    const terms = paid ? next.deal?.paymentTerms ?? "net_30" : "";
    const beforeTerms = beforePaid ? previous.payment_terms ?? "net_30" : "";
    if (terms !== beforeTerms) lines.push(`Updated payment terms on "${title}"`);

    if (day(previous.date_delivered) !== day(paid ? next.deal?.dateDelivered : null)) {
      lines.push(`Updated the delivery date on "${title}"`);
    }
    if (day(previous.date_invoiced) !== day(paid ? next.deal?.dateInvoiced : null)) {
      lines.push(`Updated the invoice date on "${title}"`);
    }
    if (day(previous.date_paid) !== day(paid ? next.deal?.datePaid : null)) {
      lines.push(`Updated the paid date on "${title}"`);
    }
  }

  const deliverables = deliverableChanged(
    previous.content_deliverables ?? [],
    paid ? next.deal?.deliverables ?? [] : [],
  );
  if (deliverables.added) lines.push(`Added a deliverable on "${title}"`);
  if (deliverables.removed) lines.push(`Removed a deliverable on "${title}"`);
  if (deliverables.updated) lines.push(`Updated a deliverable on "${title}"`);

  const expenses = expenseChanged(previous.content_expenses ?? [], next.expenses);
  if (expenses.added) lines.push(`Added an expense on "${title}"`);
  if (expenses.removed) lines.push(`Removed an expense on "${title}"`);
  if (expenses.updated) lines.push(`Updated an expense on "${title}"`);

  return lines;
}

export function invoiceChangeSummaries(
  title: string,
  previous: {
    payment_terms: string | null;
    date_invoiced: string | null;
    date_paid: string | null;
  },
  next: {
    paymentTerms: string;
    dateInvoiced: string | null;
    datePaid: string | null;
  },
) {
  const name = title.trim() || "this content";
  const lines: string[] = [];
  if ((previous.payment_terms ?? "") !== next.paymentTerms) {
    lines.push(`Updated payment terms on "${name}"`);
  }
  if (day(previous.date_invoiced) !== day(next.dateInvoiced)) {
    lines.push(`Updated the invoice date on "${name}"`);
  }
  if (day(previous.date_paid) !== day(next.datePaid)) {
    lines.push(`Updated the paid date on "${name}"`);
  }
  return lines;
}

export async function recordContentChanges(
  supabase: SupabaseClient,
  profile: Profile,
  contentId: string,
  summaries: string[],
) {
  const unique = summaries.filter(Boolean);
  if (unique.length === 0) return;
  const { error } = await supabase.from("content_changes").insert(
    unique.map((summary) => ({
      content_id: contentId,
      actor_id: profile.id,
      actor_name: displayName(profile),
      summary,
    })),
  );
  if (error) return;
}

export async function listContentChanges(
  supabase: SupabaseClient,
  contentIds: string[],
): Promise<TalentActivityItem[]> {
  if (contentIds.length === 0) return [];
  const { data } = await supabase
    .from("content_changes")
    .select("id, summary, actor_name, created_at")
    .in("content_id", contentIds)
    .order("created_at", { ascending: false })
    .limit(8);

  return (data ?? []).flatMap((row) => {
    if (typeof row.id !== "string" || typeof row.summary !== "string") return [];
    const name =
      typeof row.actor_name === "string" && row.actor_name.trim()
        ? row.actor_name.trim()
        : "";
    return [
      {
        id: row.id,
        title: row.summary,
        detail: name,
        when: typeof row.created_at === "string" ? row.created_at : "",
      },
    ];
  });
}
