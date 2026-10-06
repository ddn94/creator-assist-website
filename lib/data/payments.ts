import {
  paymentActionFor,
  paymentRowFields,
  type PaymentItem,
  type PaymentMode,
} from "@/lib/payments";
import {
  displayDate,
  displayShortDate,
  formatDeliverables,
} from "@/lib/data/format";
import { fmtMoney, type TrackerDetail, type TrackerDeal } from "@/lib/tracker";
import { moneyCode } from "@/lib/fx";
import type { TalentStatus } from "@/lib/talent";

type PaidDealSource = {
  content: TrackerDetail;
  currency: string;
};

/** Shared loop: paid collabs with a deal → map. */
function mapPaidDeals<T extends PaidDealSource, R>(
  rows: T[],
  map: (row: T & { deal: TrackerDeal }) => R,
): R[] {
  const out: R[] = [];
  for (const row of rows) {
    if (row.content.type !== "paid_collab" || !row.content.deal) continue;
    out.push(map({ ...row, deal: row.content.deal }));
  }
  return out;
}

function paymentItemFromDeal(
  mode: PaymentMode,
  content: TrackerDetail,
  deal: TrackerDeal,
  currency: string,
  formatDate: (iso: string | null) => string | null,
  extras: {
    talentName: string | null;
    talentId: string | null;
    contentHref: string | null;
  },
  today?: Date,
): PaymentItem {
  const fields = paymentRowFields(deal, formatDate, today);
  return {
    id: content.id,
    content: content.title,
    brand: content.brandName ?? "—",
    platform: content.platform,
    fee: fmtMoney(deal.feeAgreed, moneyCode(deal.currency, currency)),
    talentName: extras.talentName,
    talentId: extras.talentId,
    deliverables: formatDeliverables(deal.deliverables),
    contentHref: extras.contentHref,
    ...fields,
    action: paymentActionFor(mode, fields.status),
  };
}

export function buildTalentPayments(
  items: TrackerDetail[],
  currency: string,
  today = new Date(),
): PaymentItem[] {
  return mapPaidDeals(
    items.map((content) => ({ content, currency })),
    ({ content, deal, currency: cur }) =>
      paymentItemFromDeal(
        "talent",
        content,
        deal,
        cur,
        displayDate,
        {
          talentName: null,
          talentId: null,
          contentHref: `/home/tracker/${content.id}?section=deal&from=payments`,
        },
        today,
      ),
  );
}

export function buildAgencyPayments(
  rows: {
    content: TrackerDetail;
    talentName: string;
    talentId: string;
    currency: string;
    recordStatus?: TalentStatus;
  }[],
  today = new Date(),
): PaymentItem[] {
  return mapPaidDeals(rows, ({ content, deal, currency, talentName, talentId }) =>
    paymentItemFromDeal(
      "agency",
      content,
      deal,
      currency,
      displayShortDate,
      {
        talentName: talentName.split(" ")[0] ?? talentName,
        talentId,
        contentHref: null,
      },
      today,
    ),
  );
}
