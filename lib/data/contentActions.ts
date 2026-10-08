"use server";

import { after } from "next/server";
import { getProfile } from "@/lib/auth/session";
import {
  contentChangeSummaries,
  recordContentChanges,
  type ContentSaveSection,
  type SavedContentSnapshot,
} from "@/lib/data/contentChanges";
import {
  revalidateContent,
  requireTalentId,
} from "@/lib/data/actionHelpers";
import { moneyCode } from "@/lib/fx";
import { DEFAULT_PLATFORM } from "@/lib/platforms";
import { localTimeZone } from "@/lib/localToday";
import { mergeTimestamp, toTimestamp } from "@/lib/timestamps";
import { createClient } from "@/lib/supabase/server";
import type {
  ContentType,
  Stage,
  TrackerDetail,
  TrackerDeliverable,
  TrackerExpense,
} from "@/lib/tracker";
import type { SupabaseClient } from "@supabase/supabase-js";

function isUuid(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

function saveFailure(message: string) {
  if (message.includes("Could not save deliverables")) {
    return "Could not save deliverables.";
  }
  if (message.includes("Could not save expenses")) {
    return "Could not save expenses.";
  }
  return "Could not save content.";
}

function keptCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return null;
  return code;
}

function expenseCurrencyMap(rows: unknown): Map<string, string> {
  const currencies = new Map<string, string>();
  if (!Array.isArray(rows)) return currencies;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const id = "id" in row && typeof row.id === "string" ? row.id : "";
    const code = "currency" in row ? keptCurrency(row.currency) : null;
    if (id && code) currencies.set(id, code);
  }
  return currencies;
}

/** Currency for money that does not have one yet. Existing rows keep theirs. */
async function currencyForNewMoney(
  supabase: SupabaseClient,
  profile: { role: string; currency: string | null },
  recordId: string | null | undefined,
): Promise<string> {
  if (profile.role === "talent") return moneyCode(profile.currency);
  if (recordId) {
    const { data } = await supabase
      .from("talent_records")
      .select("currency")
      .eq("id", recordId)
      .maybeSingle();
    const code = keptCurrency(data?.currency);
    if (code) return code;
  }
  return moneyCode(profile.currency);
}

async function unclaimedRecordContent(agencyId: string, contentId: string) {
  const editable = await agencyEditableContent(agencyId, contentId);
  if (!editable || editable.claimed) return null;
  return editable.supabase;
}

/** Unclaimed record content, or a deal this agency logged that the talent now owns. */
async function agencyEditableContent(agencyId: string, contentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_items")
    .select("id, owner_id, talent_record_id, agency_created, agency_copy_of")
    .eq("id", contentId)
    .maybeSingle();
  if (!data?.talent_record_id || data.agency_copy_of) return null;
  const { data: record } = await supabase
    .from("talent_records")
    .select("id, agency_id, status")
    .eq("id", data.talent_record_id)
    .maybeSingle();
  if (!record || record.agency_id !== agencyId) return null;
  if (!data.owner_id) return { supabase, claimed: false };
  if (data.agency_created && record.status === "active") {
    return { supabase, claimed: true };
  }
  return null;
}

export async function addContentForRecordAction(
  recordId: string,
  payload: {
    title: string;
    platform: string;
    niche: string | null;
    type: ContentType;
    brandName: string | null;
    goLiveDate: string | null;
    notes?: string;
  },
): Promise<{ id: string } | { error: string }> {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== "agency") {
      return { error: "Sign in as an agency to add content for a record." };
    }
    if (!payload.title.trim()) return { error: "Title is required." };

    const supabase = await createClient();
    const { data: record } = await supabase
      .from("talent_records")
      .select("id, status, linked_user_id, currency")
      .eq("id", recordId)
      .eq("agency_id", profile.id)
      .maybeSingle();
    if (
      !record ||
      record.status !== "record" ||
      record.linked_user_id
    ) {
      return { error: "You can only add content for a record that has not been invited." };
    }

    const isPaid = payload.type === "paid_collab";
    const timeZone = await localTimeZone();
    const { data, error } = await supabase
      .from("content_items")
      .insert({
        owner_id: null,
        talent_record_id: recordId,
        agency_created: true,
        title: payload.title.trim(),
        platform: payload.platform || DEFAULT_PLATFORM,
        niche: payload.niche,
        type: payload.type,
        brand_name: isPaid ? payload.brandName : null,
        stage: "concept",
        go_live_date: toTimestamp(payload.goLiveDate, timeZone),
        notes: payload.notes ?? "",
        fee_agreed: isPaid ? 0 : null,
        currency: isPaid ? moneyCode(record.currency) : null,
        payment_terms: isPaid ? "net_30" : null,
      })
      .select("id")
      .single();
    if (error || !data) return { error: "Could not add content." };
    await recordContentChanges(supabase, profile, data.id, [
      `Added "${payload.title.trim()}"`,
    ]);
    revalidateContent([`/workspace/talent/${recordId}`]);
    return { id: data.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not add content.",
    };
  }
}

export async function addContentAction(payload: {
  title: string;
  platform: string;
  niche: string | null;
  type: ContentType;
  brandName: string | null;
  goLiveDate: string | null;
  notes?: string;
  ideaTitle?: string | null;
}): Promise<{ id: string } | { error: string }> {
  try {
    const ownerId = await requireTalentId();
    if (!payload.title.trim()) return { error: "Title is required." };
    const supabase = await createClient();
    const profile = await getProfile();
    const isPaid = payload.type === "paid_collab";
    const timeZone = await localTimeZone();
    const { data, error } = await supabase
      .from("content_items")
      .insert({
        owner_id: ownerId,
        title: payload.title.trim(),
        platform: payload.platform || DEFAULT_PLATFORM,
        niche: payload.niche,
        type: payload.type,
        brand_name: isPaid ? payload.brandName : null,
        stage: "concept",
        go_live_date: toTimestamp(payload.goLiveDate, timeZone),
        notes: payload.notes ?? "",
        idea_title: payload.ideaTitle ?? null,
        fee_agreed: isPaid ? 0 : null,
        currency: isPaid ? moneyCode(profile?.currency) : null,
        payment_terms: isPaid ? "net_30" : null,
      })
      .select("id")
      .single();
    if (error || !data) return { error: "Could not add content." };
    if (profile) {
      await recordContentChanges(supabase, profile, data.id, [
        `Added "${payload.title.trim()}"`,
      ]);
    }
    revalidateContent([`/overview/tracker/${data.id}`]);
    return { id: data.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not add content.",
    };
  }
}

export async function setContentStageAction(
  id: string,
  stage: Stage,
): Promise<{ error: string | null }> {
  try {
    const profile = await getProfile();
    if (!profile) return { error: "Sign in required." };
    const supabase =
      profile.role === "agency"
        ? await unclaimedRecordContent(profile.id, id)
        : profile.role === "talent"
          ? await createClient()
          : null;
    if (!supabase) return { error: "Could not update stage." };
    let query = supabase.from("content_items").update({ stage }).eq("id", id);
    if (profile.role === "agency") query = query.is("owner_id", null);
    const { error } = await query;
    if (error) return { error: "Could not update stage." };
    revalidateContent([`/overview/tracker/${id}`]);
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update stage.",
    };
  }
}

export async function deleteContentAction(
  id: string,
): Promise<{ error: string | null }> {
  try {
    const profile = await getProfile();
    if (!profile) return { error: "Sign in required." };
    const supabase =
      profile.role === "agency"
        ? await unclaimedRecordContent(profile.id, id)
        : profile.role === "talent"
          ? await createClient()
          : null;
    if (!supabase) return { error: "Could not delete content." };
    if (profile.role === "talent") {
      const { error } = await supabase.rpc("delete_owned_content", { p_id: id });
      if (error) return { error: "Could not delete content." };
      revalidateContent();
      return { error: null };
    }
    await supabase
      .from("ideas")
      .update({ linked_content_id: null, status: "idea" })
      .eq("linked_content_id", id);
    let query = supabase.from("content_items").delete().eq("id", id);
    if (profile.role === "agency") query = query.is("owner_id", null);
    const { error } = await query;
    if (error) return { error: "Could not delete content." };
    revalidateContent();
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not delete content.",
    };
  }
}

type StoredLine = {
  id?: string;
  type?: string;
  quantity?: number | string;
  rate?: number | string;
  sort_order?: number | string;
  category?: string;
  amount?: number | string;
  note?: string | null;
  expense_date?: string;
  currency?: string | null;
};

type StoredContent = SavedContentSnapshot & {
  platform: string;
  niche: string | null;
  brand_name: string | null;
  stage: string;
  go_live_date: string | null;
  shot_list: string | null;
  idea_title: string | null;
};

function asLines(value: unknown): StoredLine[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is StoredLine => !!row && typeof row === "object");
}

function moneyAmount(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function lineId(id: string | undefined) {
  return id && isUuid(id) ? id : null;
}

function bySort(rows: StoredLine[]) {
  return rows
    .slice()
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}

function deliverableRows(rows: TrackerDeliverable[]) {
  return rows.map((row) => ({
    id: lineId(row.id),
    type: row.type,
    quantity: row.quantity,
    rate: row.rate,
  }));
}

function storedDeliverableRows(rows: unknown) {
  return bySort(asLines(rows)).map((row) => ({
    id: lineId(row.id),
    type: row.type ?? "video",
    quantity: Number(row.quantity ?? 1),
    rate: moneyAmount(row.rate),
  }));
}

function expenseRows(
  rows: TrackerExpense[],
  previousExpenses: Map<string, string>,
  dealCurrency: string | null,
  freshCurrency: string,
  timeZone?: string | null,
) {
  return rows.map((row) => ({
    id: lineId(row.id),
    category: row.category,
    amount: row.amount,
    note: row.note,
    expense_date: toTimestamp(row.date, timeZone) ?? row.date,
    currency:
      keptCurrency(row.currency) ??
      previousExpenses.get(row.id) ??
      dealCurrency ??
      freshCurrency,
  }));
}

function storedExpenseRows(rows: unknown, fallbackCurrency: string | null) {
  return bySort(asLines(rows)).map((row) => ({
    id: lineId(row.id),
    category: row.category ?? "other",
    amount: moneyAmount(row.amount),
    note: row.note ?? null,
    expense_date: row.expense_date ?? "",
    currency: keptCurrency(row.currency) ?? fallbackCurrency,
  }));
}

/**
 * Save one section. Every other field is copied from the row just read,
 * so typing that has not been saved in another section cannot overwrite it.
 */
export async function upsertContentAction(
  item: TrackerDetail,
  section: ContentSaveSection,
): Promise<{ error: string | null }> {
  try {
    const profile = await getProfile();
    if (!profile) return { error: "Sign in required." };
    const editable =
      profile.role === "agency"
        ? await agencyEditableContent(profile.id, item.id)
        : null;
    if (profile.role === "agency" && !editable) {
      return { error: "Could not save content." };
    }
    if (profile.role !== "agency" && profile.role !== "talent") {
      return { error: "Could not save content." };
    }
    const supabase = editable?.supabase ?? (await createClient());
    const { data, error: readError } = await supabase
      .from("content_items")
      .select(
        "title, platform, niche, type, brand_name, stage, go_live_date, shot_list, notes, idea_title, fee_agreed, currency, payment_terms, date_delivered, date_invoiced, date_paid, content_deliverables (id, type, quantity, rate, sort_order), content_expenses (id, category, amount, note, expense_date, currency, sort_order)",
      )
      .eq("id", item.id)
      .maybeSingle();
    const stored = data as StoredContent | null;
    if (readError || !stored) return { error: "Could not save content." };

    const wasPaid = stored.type === "paid_collab";
    const previousDealCurrency = keptCurrency(stored.currency);
    const previousExpenses = expenseCurrencyMap(stored.content_expenses);
    const requestedDealCurrency = keptCurrency(item.deal?.currency);
    const creatingDeal =
      section === "details" && item.type === "paid_collab" && !wasPaid;
    const needsFreshCurrency =
      (section === "deal" && !requestedDealCurrency && !previousDealCurrency) ||
      (creatingDeal && !requestedDealCurrency && !previousDealCurrency) ||
      (section === "expenses" &&
        item.expenses.some(
          (row) => !keptCurrency(row.currency) && !previousExpenses.get(row.id),
        ));
    const freshCurrency = needsFreshCurrency
      ? await currencyForNewMoney(supabase, profile, item.talentRecordId)
      : "USD";
    const keptDealCurrency =
      previousDealCurrency ?? (wasPaid ? freshCurrency : null);
    const timeZone = await localTimeZone();

    const payload = {
      p_id: item.id,
      p_title: stored.title,
      p_platform: stored.platform,
      p_niche: stored.niche,
      p_type: stored.type,
      p_brand_name: stored.brand_name,
      p_stage: stored.stage,
      p_go_live_date: stored.go_live_date,
      p_shot_list: stored.shot_list ?? "",
      p_notes: stored.notes ?? "",
      p_idea_title: stored.idea_title,
      p_fee_agreed: wasPaid ? moneyAmount(stored.fee_agreed) : null,
      p_currency: wasPaid ? keptDealCurrency : null,
      p_payment_terms: wasPaid ? (stored.payment_terms ?? "net_30") : null,
      p_date_delivered: wasPaid ? stored.date_delivered : null,
      p_date_invoiced: wasPaid ? stored.date_invoiced : null,
      p_date_paid: wasPaid ? stored.date_paid : null,
      p_deliverables: wasPaid
        ? storedDeliverableRows(stored.content_deliverables)
        : [],
      p_expenses: storedExpenseRows(stored.content_expenses, keptDealCurrency),
    };

    if (section === "details") {
      const paid = item.type === "paid_collab";
      payload.p_title = item.title.trim();
      payload.p_platform = item.platform;
      payload.p_niche = item.niche;
      payload.p_type = item.type;
      payload.p_brand_name = paid ? item.brandName : null;
      payload.p_stage = item.stage;
      payload.p_go_live_date = mergeTimestamp(
        stored.go_live_date,
        item.goLiveDate,
        timeZone,
      );
      payload.p_shot_list = item.shotList;
      payload.p_notes = item.notes;
      if (!paid) {
        payload.p_fee_agreed = null;
        payload.p_currency = null;
        payload.p_payment_terms = null;
        payload.p_date_delivered = null;
        payload.p_date_invoiced = null;
        payload.p_date_paid = null;
        payload.p_deliverables = [];
      } else if (!wasPaid) {
        payload.p_fee_agreed = 0;
        payload.p_currency =
          requestedDealCurrency ?? previousDealCurrency ?? freshCurrency;
        payload.p_payment_terms = "net_30";
        payload.p_date_delivered = null;
        payload.p_date_invoiced = null;
        payload.p_date_paid = null;
        payload.p_deliverables = [];
      }
    } else if (section === "deal") {
      payload.p_type = "paid_collab";
      payload.p_fee_agreed = moneyAmount(item.deal?.feeAgreed);
      payload.p_currency =
        requestedDealCurrency ?? previousDealCurrency ?? freshCurrency;
      payload.p_payment_terms = item.deal?.paymentTerms ?? "net_30";
      payload.p_date_delivered = mergeTimestamp(
        stored.date_delivered,
        item.deal?.dateDelivered,
        timeZone,
      );
      payload.p_date_invoiced = mergeTimestamp(
        stored.date_invoiced,
        item.deal?.dateInvoiced,
        timeZone,
      );
      payload.p_date_paid = mergeTimestamp(
        stored.date_paid,
        item.deal?.datePaid,
        timeZone,
      );
    } else if (section === "deliverables") {
      payload.p_deliverables = deliverableRows(item.deal?.deliverables ?? []);
      if (
        requestedDealCurrency &&
        requestedDealCurrency !== previousDealCurrency
      ) {
        payload.p_currency = requestedDealCurrency;
      }
    } else {
      payload.p_expenses = expenseRows(
        item.expenses,
        previousExpenses,
        keptDealCurrency,
        freshCurrency,
        timeZone,
      );
    }

    const { error } = await supabase.rpc("save_content", payload);
    if (error) return { error: saveFailure(error.message) };

    const summaries = contentChangeSummaries(stored, item, section, timeZone);
    const contentId = item.id;
    // The activity line has to be stored before the page refreshes it.
    // Marking the other pages stale can wait until this reply has gone out.
    await recordContentChanges(supabase, profile, contentId, summaries);
    after(() => {
      revalidateContent([`/overview/tracker/${contentId}`]);
    });
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save content.",
    };
  }
}
