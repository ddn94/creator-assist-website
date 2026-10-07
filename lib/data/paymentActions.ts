"use server";

import { getProfile } from "@/lib/auth/session";
import {
  revalidateContent,
  requireTalentId,
} from "@/lib/data/actionHelpers";
import {
  invoiceChangeSummaries,
  recordContentChanges,
} from "@/lib/data/contentChanges";
import { localTimeZone } from "@/lib/localToday";
import { mergeTimestamp, nowTimestamp } from "@/lib/timestamps";
import { createClient } from "@/lib/supabase/server";
import type { PaymentTerms } from "@/lib/tracker";

export async function markContentPaidAction(
  contentId: string,
): Promise<{ error: string | null }> {
  try {
    await requireTalentId();
    // One format: real UTC moment. Shown later in the viewer's timezone.
    const paid = nowTimestamp();
    const profile = await getProfile();
    if (!profile) return { error: "Sign in required." };
    const supabase = await createClient();
    const { data } = await supabase
      .from("content_items")
      .select("id, title")
      .eq("id", contentId)
      .maybeSingle();
    if (!data) return { error: "Content not found." };
    const { error } = await supabase
      .from("content_items")
      .update({ date_paid: paid })
      .eq("id", contentId);
    if (error) return { error: "Could not mark paid." };
    const title = typeof data.title === "string" ? data.title : "this content";
    await recordContentChanges(supabase, profile, contentId, [
      `Marked "${title}" as paid`,
    ]);
    revalidateContent([`/home/tracker/${contentId}`]);
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not mark paid.",
    };
  }
}

export async function markContentInvoicedAction(
  contentId: string,
  terms: PaymentTerms,
): Promise<{ error: string | null }> {
  try {
    await requireTalentId();
    // One format: real UTC moment. Shown later in the viewer's timezone.
    const invoiced = nowTimestamp();
    const profile = await getProfile();
    if (!profile) return { error: "Sign in required." };
    const supabase = await createClient();
    const { data } = await supabase
      .from("content_items")
      .select("id, title")
      .eq("id", contentId)
      .maybeSingle();
    if (!data) return { error: "Content not found." };
    const { error } = await supabase
      .from("content_items")
      .update({
        payment_terms: terms,
        date_invoiced: invoiced,
        date_paid: null,
      })
      .eq("id", contentId);
    if (error) return { error: "Could not mark invoiced." };
    const title = typeof data.title === "string" ? data.title : "this content";
    await recordContentChanges(supabase, profile, contentId, [
      `Marked "${title}" as invoiced`,
    ]);
    revalidateContent([`/home/tracker/${contentId}`]);
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not mark invoiced.",
    };
  }
}

export async function updateContentInvoiceAction(
  contentId: string,
  payload: {
    dateInvoiced: string;
    paymentTerms: PaymentTerms;
    datePaid: string | null;
  },
): Promise<{ error: string | null }> {
  try {
    const profile = await getProfile();
    if (!profile) return { error: "Sign in required." };
    const invoicedDay = payload.dateInvoiced.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(invoicedDay)) {
      return { error: "Enter a valid invoice date." };
    }
    const paidDay = payload.datePaid?.slice(0, 10) || null;
    if (paidDay && !/^\d{4}-\d{2}-\d{2}$/.test(paidDay)) {
      return { error: "Enter a valid paid date." };
    }

    const supabase = await createClient();
    const { data } = await supabase
      .from("content_items")
      .select("title, payment_terms, date_delivered, date_invoiced, date_paid")
      .eq("id", contentId)
      .maybeSingle();
    if (!data) return { error: "Content not found." };

    const timeZone = await localTimeZone();
    const invoiced = mergeTimestamp(
      typeof data.date_invoiced === "string" ? data.date_invoiced : null,
      invoicedDay,
      timeZone,
    );
    const paid = mergeTimestamp(
      typeof data.date_paid === "string" ? data.date_paid : null,
      paidDay,
      timeZone,
    );
    const { error } = await supabase
      .from("content_items")
      .update({
        payment_terms: payload.paymentTerms,
        date_invoiced: invoiced,
        date_delivered:
          data.date_delivered ??
          mergeTimestamp(null, invoicedDay, timeZone),
        date_paid: paid,
      })
      .eq("id", contentId);
    if (error) return { error: "Could not update invoice." };
    const title = typeof data.title === "string" ? data.title : "";
    await recordContentChanges(
      supabase,
      profile,
      contentId,
      invoiceChangeSummaries(
        title,
        {
          payment_terms:
            typeof data.payment_terms === "string" ? data.payment_terms : null,
          date_invoiced:
            typeof data.date_invoiced === "string" ? data.date_invoiced : null,
          date_paid: typeof data.date_paid === "string" ? data.date_paid : null,
        },
        {
          paymentTerms: payload.paymentTerms,
          dateInvoiced: invoicedDay,
          datePaid: paidDay,
        },
        timeZone,
      ),
    );
    revalidateContent([`/home/tracker/${contentId}`]);
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update invoice.",
    };
  }
}
