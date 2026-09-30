import { daysBetween, displayShortDate } from "@/lib/data/format";
import type { LinkedTalentMeta } from "@/lib/data/linkedTalent";
import type { TalentRecord } from "@/lib/data/talentRecords";
import { toTalentItem } from "@/lib/data/talentItem";
import {
  attentionPaymentStatus,
  paymentRowFields,
} from "@/lib/payments";
import {
  type TalentActivityItem,
  type TalentDeal,
  type TalentDetail,
  type TalentInvoicing,
  type TalentItem,
} from "@/lib/talent";
import {
  STAGE_LABELS,
  computeDueDate,
  fmtMoney,
  type Stage,
  type TrackerDetail,
} from "@/lib/tracker";

/**
 * Fills in the roster table's "Live deals" and "Outstanding" columns from
 * each talent's real content/deal data, instead of leaving them blank.
 * Talent with no linked content (invited or record-only, or simply no paid
 * collabs yet) fall back to the "—" placeholder from toTalentItem.
 */
export function buildTalentRoster(
  records: TalentRecord[],
  rows: { content: TrackerDetail; talentId: string }[],
  avatars?: Map<string, LinkedTalentMeta>,
): TalentItem[] {
  const byTalent = new Map<string, TrackerDetail[]>();
  for (const { content, talentId } of rows) {
    const list = byTalent.get(talentId);
    if (list) list.push(content);
    else byTalent.set(talentId, [content]);
  }

  return records.map((record) => {
    const meta = avatars?.get(record.id) ?? null;
    const base = toTalentItem(record, meta);
    const items = byTalent.get(record.id);
    if (!items || items.length === 0) return base;

    const currency = meta ? meta.currency || "USD" : record.currency || "USD";
    const openDeals = items.filter(
      (item) => item.type === "paid_collab" && item.deal && !item.deal.datePaid,
    );
    const outstanding = openDeals.reduce(
      (sum, item) => sum + (item.deal?.feeAgreed ?? 0),
      0,
    );

    return {
      ...base,
      liveDeals: String(openDeals.length),
      outstanding: fmtMoney(outstanding, currency),
    };
  });
}

export function buildTalentDetailFromRecord(
  record: TalentRecord,
  items: TrackerDetail[],
  today = new Date(),
  avatar?: LinkedTalentMeta | null,
  activity: TalentActivityItem[] = [],
): TalentDetail {
  const base: TalentItem = toTalentItem(record, avatar);
  const currency = avatar
    ? avatar.currency || "USD"
    : record.currency || "USD";
  const deals: TalentDeal[] = items.map((item) => {
    const fields = item.deal
      ? paymentRowFields(item.deal, displayShortDate, today)
      : null;
    const payment = fields ? attentionPaymentStatus(fields.status) : null;
    return {
      id: item.id,
      content: item.title,
      brand: item.brandName,
      platform: item.platform,
      fee: item.deal ? fmtMoney(item.deal.feeAgreed, currency) : null,
      stage: STAGE_LABELS[item.stage as Stage] ?? item.stage,
      payment,
      paymentLabel: payment && fields ? fields.statusLabel : null,
    };
  });

  const withFields = items.flatMap((item) => {
    if (!item.deal) return [];
    const fields = paymentRowFields(item.deal, displayShortDate, today);
    return [{ item, fields }];
  });
  const invoiceSource =
    withFields.find(({ fields }) => fields.status === "overdue") ??
    withFields.find(({ fields }) => fields.status === "awaiting_payment") ??
    null;

  let invoicing: TalentInvoicing | null = null;
  if (invoiceSource) {
    const { item, fields } = invoiceSource;
    const deal = item.deal!;
    const fee = fmtMoney(deal.feeAgreed, currency);
    const dueIso = computeDueDate(deal);
    invoicing = {
      contentId: item.id,
      dealTitle: item.title,
      summary: `${fee} · delivered ${fields.delivered ?? "—"}`,
      dateInvoiced: fields.dateInvoicedIso ?? "",
      paymentTerms: deal.paymentTerms,
      datePaid: fields.datePaidIso ?? "",
      dueNote: fields.due
        ? `Due ${fields.due}${
            fields.status === "overdue" && dueIso
              ? ` · ${daysBetween(dueIso, today)} days overdue`
              : ""
          }`
        : "Not invoiced",
    };
  }

  return {
    ...base,
    firstName: base.name.split(" ")[0] || base.name,
    notes: record.notes?.trim() || null,
    deals,
    invoicing,
    activity,
  };
}
