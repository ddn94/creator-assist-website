"use server";

import {
  revalidateContent,
  requireTalentId,
} from "@/lib/data/actionHelpers";
import { DEFAULT_PLATFORM } from "@/lib/platforms";
import { createClient } from "@/lib/supabase/server";
import type {
  ContentType,
  Stage,
  TrackerDetail,
  TrackerDeliverable,
  TrackerExpense,
} from "@/lib/tracker";

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
        go_live_date: payload.goLiveDate || null,
        notes: payload.notes ?? "",
        idea_title: payload.ideaTitle ?? null,
        fee_agreed: isPaid ? 0 : null,
        payment_terms: isPaid ? "net_30" : null,
      })
      .select("id")
      .single();
    if (error || !data) return { error: "Could not add content." };
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
    await requireTalentId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("content_items")
      .update({ stage })
      .eq("id", id);
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
    await requireTalentId();
    const supabase = await createClient();
    await supabase
      .from("ideas")
      .update({ linked_content_id: null, status: "idea" })
      .eq("linked_content_id", id);
    const { error } = await supabase.from("content_items").delete().eq("id", id);
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
    const ownerId = await requireTalentId();
    const supabase = await createClient();
    const isPaid = item.type === "paid_collab";
    const { error } = await supabase
      .from("content_items")
      .update({
        title: item.title.trim(),
        platform: item.platform,
        niche: item.niche,
        type: item.type,
        brand_name: isPaid ? item.brandName : null,
        stage: item.stage,
        go_live_date: item.goLiveDate,
        shot_list: item.shotList,
        notes: item.notes,
        idea_title: item.ideaTitle,
        fee_agreed: isPaid ? (item.deal?.feeAgreed ?? 0) : null,
        payment_terms: isPaid ? (item.deal?.paymentTerms ?? "net_30") : null,
        date_delivered: isPaid ? (item.deal?.dateDelivered ?? null) : null,
        date_invoiced: isPaid ? (item.deal?.dateInvoiced ?? null) : null,
        date_paid: isPaid ? (item.deal?.datePaid ?? null) : null,
      })
      .eq("id", item.id)
      .eq("owner_id", ownerId);
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
          sort_order: index,
        };
        return /^[0-9a-f-]{36}$/i.test(row.id) ? { id: row.id, ...base } : base;
      });
      const { error: eError } = await supabase
        .from("content_expenses")
        .insert(rows);
      if (eError) return { error: "Could not save expenses." };
    }

    revalidateContent([`/home/tracker/${item.id}`]);
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save content.",
    };
  }
}
