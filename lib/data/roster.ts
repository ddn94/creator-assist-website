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
  formatLiveDate,
  type Stage,
  type TrackerDetail,
} from "@/lib/tracker";

/**
 * Derives a real, chronological activity feed from the timestamps actually
 * stored on each piece of content (created_at, date_delivered,
 * date_invoiced, date_paid, updated_at). No separate event log exists yet,
 * so each milestone a creator hits generates one entry, sorted by when it
 * really happened.
 */
export function buildTalentActivity(
  items: TrackerDetail[],
  currency: string,
  today = new Date(),
): TalentActivityItem[] {
  const todayIso = today.toISOString().slice(0, 10);
  const events: (TalentActivityItem & { sort: string })[] = [];

  for (const item of items) {
    events.push({
      id: `${item.id}-created`,
      title: `Added "${item.title}"`,
      detail: item.platform,
      when: item.createdAtIso ?? item.createdAt,
      sort: item.createdAtIso ?? item.createdAt,
    });

    if (item.deal?.dateDelivered) {
      events.push({
        id: `${item.id}-delivered`,
        title: `Delivered "${item.title}"`,
        detail: item.brandName ?? item.platform,
        when: item.deal.dateDelivered,
        sort: item.deal.dateDelivered,
      });
    }

    if (item.deal?.dateInvoiced) {
      events.push({
        id: `${item.id}-invoiced`,
        title: `Invoiced "${item.title}"`,
        detail: fmtMoney(item.deal.feeAgreed, currency),
        when: item.deal.dateInvoiced,
        sort: item.deal.dateInvoiced,
      });
    }

    if (item.deal?.datePaid) {
      events.push({
        id: `${item.id}-paid`,
        title: `Payment received for "${item.title}"`,
        detail: fmtMoney(item.deal.feeAgreed, currency),
        when: item.deal.datePaid,
        sort: item.deal.datePaid,
      });
    }

    if (item.goLiveDate && item.goLiveDate.slice(0, 10) <= todayIso) {
      events.push({
        id: `${item.id}-live`,
        title: `"${item.title}" went live`,
        detail: item.platform,
        when: item.goLiveDate,
        sort: item.goLiveDate,
      });
    }

    const knownDates = new Set(
      [
        item.createdAt,
        item.deal?.dateDelivered,
        item.deal?.dateInvoiced,
        item.deal?.datePaid,
        item.goLiveDate,
      ]
        .filter((d): d is string => !!d)
        .map((d) => d.slice(0, 10)),
    );
    if (!knownDates.has(item.updatedAt.slice(0, 10))) {
      events.push({
        id: `${item.id}-updated`,
        title: `Updated "${item.title}"`,
        detail: STAGE_LABELS[item.stage as Stage] ?? item.stage,
        when: item.updatedAtIso ?? item.updatedAt,
        sort: item.updatedAtIso ?? item.updatedAt,
      });
    }
  }

  return events
    .sort((a, b) => b.sort.localeCompare(a.sort))
    .slice(0, 8)
    .map(({ sort: _sort, ...rest }) => {
      void _sort;
      return rest;
    });
}

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

  const activity: TalentActivityItem[] = buildTalentActivity(
    items,
    currency,
    today,
  );

  return {
    ...base,
    firstName: base.name.split(" ")[0] || base.name,
    notes: record.notes?.trim() || null,
    deals,
    invoicing,
    activity,
  };
}
