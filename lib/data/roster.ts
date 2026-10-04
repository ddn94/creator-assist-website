import { daysBetween, displayShortDate } from "@/lib/data/format";
import { moneyCode, totalInCurrency } from "@/lib/fx";
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
    const outstanding = totalInCurrency(
      openDeals.map((item) => ({
        amount: item.deal?.feeAgreed ?? 0,
        currency: item.deal?.currency,
      })),
      currency,
    );

    return {
      ...base,
      liveDeals: String(openDeals.length),
      outstanding: fmtMoney(outstanding.amount, outstanding.currency),
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
      fee: item.deal
        ? fmtMoney(item.deal.feeAgreed, moneyCode(item.deal.currency, currency))
        : null,
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
  const invoicing = withFields
    .filter(
      ({ fields }) =>
        fields.status === "overdue" || fields.status === "awaiting_payment",
    )
    .sort((a, b) => {
      if (a.fields.status !== b.fields.status) {
        return a.fields.status === "overdue" ? -1 : 1;
      }
      const aDue = a.item.deal ? computeDueDate(a.item.deal) : null;
      const bDue = b.item.deal ? computeDueDate(b.item.deal) : null;
      if (aDue && bDue && aDue !== bDue) return aDue < bDue ? -1 : 1;
      return 0;
    })
    .map(({ item, fields }): TalentInvoicing => {
      const deal = item.deal!;
      const fee = fmtMoney(deal.feeAgreed, moneyCode(deal.currency, currency));
      const dueIso = computeDueDate(deal);
      return {
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
    });

  return {
    ...base,
    firstName: base.name.split(" ")[0] || base.name,
    notes: record.notes?.trim() || null,
    deals,
    invoicing,
    activity,
  };
}
