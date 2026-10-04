"use server";

import { getProfile } from "@/lib/auth/session";
import {
  contentChangeSummaries,
  recordContentChanges,
  type SavedContentSnapshot,
} from "@/lib/data/contentChanges";
import {
  revalidateContent,
  requireTalentId,
} from "@/lib/data/actionHelpers";
import { moneyCode } from "@/lib/fx";
import { DEFAULT_PLATFORM } from "@/lib/platforms";
import { toTimestamp } from "@/lib/timestamps";
import { createClient } from "@/lib/supabase/server";
import type {
  ContentType,
  Stage,
  TrackerDetail,
  TrackerDeliverable,
  TrackerExpense,
} from "@/lib/tracker";
import type { SupabaseClient } from "@supabase/supabase-js";

function keptCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return code || null;
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
        go_live_date: toTimestamp(payload.goLiveDate),
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
        go_live_date: toTimestamp(payload.goLiveDate),
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
    revalidateContent([`/home/tracker/${data.id}`]);
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
    revalidateContent([`/home/tracker/${id}`]);
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

export async function upsertContentAction(
  item: TrackerDetail,
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
    const { data: previous } = await supabase
      .from("content_items")
      .select(
        "title, notes, type, fee_agreed, currency, payment_terms, date_delivered, date_invoiced, date_paid, content_deliverables (id, type, quantity, rate), content_expenses (id, category, amount, note, expense_date, currency)",
      )
      .eq("id", item.id)
      .maybeSingle();
    const isPaid = item.type === "paid_collab";
    const previousDealCurrency = keptCurrency(previous?.currency);
    const previousExpenses = expenseCurrencyMap(previous?.content_expenses);
    const needsFreshCurrency =
      (isPaid && !previousDealCurrency) ||
      item.expenses.some((row) => !previousExpenses.get(row.id));
    const freshCurrency = needsFreshCurrency
      ? await currencyForNewMoney(supabase, profile, item.talentRecordId)
      : "USD";
    const dealCurrency = isPaid
      ? (previousDealCurrency ?? freshCurrency)
      : null;
    let update = supabase
      .from("content_items")
      .update({
        title: item.title.trim(),
        platform: item.platform,
        niche: item.niche,
        type: item.type,
        brand_name: isPaid ? item.brandName : null,
        stage: item.stage,
        go_live_date: toTimestamp(item.goLiveDate),
        shot_list: item.shotList,
        notes: item.notes,
        idea_title: item.ideaTitle,
        fee_agreed: isPaid ? (item.deal?.feeAgreed ?? 0) : null,
        currency: dealCurrency,
        payment_terms: isPaid ? (item.deal?.paymentTerms ?? "net_30") : null,
        date_delivered: isPaid ? toTimestamp(item.deal?.dateDelivered) : null,
        date_invoiced: isPaid ? toTimestamp(item.deal?.dateInvoiced) : null,
        date_paid: isPaid ? toTimestamp(item.deal?.datePaid) : null,
      })
      .eq("id", item.id);
    if (profile.role === "agency" && !editable?.claimed) {
      update = update.is("owner_id", null);
    } else if (profile.role !== "agency") {
      update = update.eq("owner_id", profile.id);
    }
    const { error } = await update;
    if (error) return { error: "Could not save content." };

    await supabase.from("content_deliverables").delete().eq("content_id", item.id);
    await supabase.from("content_expenses").delete().eq("content_id", item.id);

    if (isPaid && item.deal?.deliverables.length) {
      const rows = item.deal.deliverables.map(
        (row: TrackerDeliverable, index) => {
          const base = {
            content_id: item.id,
            type: row.type,
            quantity: row.quantity,
            rate: row.rate,
            sort_order: index,
          };
          return /^[0-9a-f-]{36}$/i.test(row.id)
            ? { id: row.id, ...base }
            : base;
        },
      );
      const { error: dError } = await supabase
        .from("content_deliverables")
        .insert(rows);
      if (dError) return { error: "Could not save deliverables." };
    }

    if (item.expenses.length) {
      const rows = item.expenses.map((row: TrackerExpense, index) => {
        const base = {
          content_id: item.id,
          category: row.category,
          amount: row.amount,
          note: row.note,
          expense_date: row.date,
          currency: previousExpenses.get(row.id) ?? freshCurrency,
          sort_order: index,
        };
        return /^[0-9a-f-]{36}$/i.test(row.id) ? { id: row.id, ...base } : base;
      });
      const { error: eError } = await supabase
        .from("content_expenses")
        .insert(rows);
      if (eError) return { error: "Could not save expenses." };
    }

    if (previous) {
      await recordContentChanges(
        supabase,
        profile,
        item.id,
        contentChangeSummaries(previous as SavedContentSnapshot, item),
      );
    }

    revalidateContent([`/home/tracker/${item.id}`]);
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save content.",
    };
  }
}
