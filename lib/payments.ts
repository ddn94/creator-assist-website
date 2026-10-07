import { calendarDay } from "@/lib/calendarDay";
import {
  displayDate,
  displayShortDate,
} from "@/lib/data/format";
import {
  DEAL_STATUS_LABELS,
  TERM_LABELS,
  computeDealStatus,
  computeDueDate,
  dealStatusTone,
  type DealStatus,
  type PaymentTerms,
} from "@/lib/tracker";

/** Canonical payment status — same list as deal status. */
export type PaymentStatus = DealStatus;

export type PaymentMode = "talent" | "agency";

export {
  DEAL_STATUS_LABELS as PAYMENT_STATUS_LABELS,
  dealStatusTone as paymentStatusTone,
  computeDealStatus,
};

export const PAYMENT_STATUSES = [
  "overdue",
  "awaiting_payment",
  "not_invoiced",
  "paid",
] as const satisfies readonly PaymentStatus[];

export const PAYMENT_STATUS_FILTERS = [
  { id: "all" as const, label: "All" },
  ...PAYMENT_STATUSES.map((id) => ({
    id,
    label: DEAL_STATUS_LABELS[id],
  })),
];

export const PAYMENT_STATUS_ORDER: Record<PaymentStatus, number> = {
  overdue: 0,
  awaiting_payment: 1,
  not_invoiced: 2,
  paid: 3,
};

export type PaymentAction =
  | "edit"
  | "setInvoice"
  | "markPaid"
  | "markInvoiced"
  | "done"
  | "none";

/** One row shape for both talent and agency payment lists. */
export type PaymentItem = {
  id: string;
  content: string;
  brand: string;
  platform: string;
  fee: string;
  talentName: string | null;
  talentId: string | null;
  deliverables: string;
  contentHref: string | null;
  paymentTerms: PaymentTerms | null;
  termsLabel: string | null;
  dateInvoicedIso: string | null;
  datePaidIso: string | null;
  delivered: string | null;
  invoiced: string | null;
  due: string | null;
  status: PaymentStatus;
  statusLabel: string;
  paid: string | null;
  action: PaymentAction;
};

/** Profile deal list only surfaces open invoices. */
export type AttentionPaymentStatus = Extract<
  PaymentStatus,
  "overdue" | "awaiting_payment"
> | null;

export function attentionPaymentStatus(
  status: PaymentStatus,
): AttentionPaymentStatus {
  if (status === "overdue" || status === "awaiting_payment") return status;
  return null;
}

export function paymentActionFor(
  mode: PaymentMode,
  status: PaymentStatus,
): PaymentAction {
  if (mode === "agency") {
    return status === "not_invoiced" ? "setInvoice" : "edit";
  }
  if (status === "paid") return "done";
  if (status === "not_invoiced") return "markInvoiced";
  if (status === "awaiting_payment" || status === "overdue") return "markPaid";
  return "none";
}

type DealDates = {
  paymentTerms: PaymentTerms;
  dateInvoiced: string | null;
  datePaid: string | null;
  dateDelivered?: string | null;
};

/** Dates, terms, and status derived from a deal — one place for the math. */
export function paymentRowFields(
  deal: DealDates,
  formatDate: (iso: string | null) => string | null,
  today?: Date,
  timeZone?: string | null,
): Pick<
  PaymentItem,
  | "paymentTerms"
  | "termsLabel"
  | "dateInvoicedIso"
  | "datePaidIso"
  | "delivered"
  | "invoiced"
  | "due"
  | "status"
  | "statusLabel"
  | "paid"
> {
  const status = computeDealStatus(deal, today, timeZone);
  const dueIso = computeDueDate(deal, timeZone);
  return {
    paymentTerms: deal.paymentTerms,
    termsLabel: TERM_LABELS[deal.paymentTerms],
    dateInvoicedIso: deal.dateInvoiced,
    datePaidIso: deal.datePaid,
    delivered: formatDate(deal.dateDelivered ?? null),
    invoiced: formatDate(deal.dateInvoiced),
    due: formatDate(dueIso),
    status,
    statusLabel: DEAL_STATUS_LABELS[status],
    paid: formatDate(deal.datePaid),
  };
}

/** Optimistic agency edit — same field math as a server rebuild. */
export function withInvoice(
  item: PaymentItem,
  patch: {
    dateInvoiced: string;
    paymentTerms: PaymentTerms;
    datePaid: string | null;
  },
): PaymentItem {
  const fields = paymentRowFields(
    {
      paymentTerms: patch.paymentTerms,
      dateInvoiced: patch.dateInvoiced,
      datePaid: patch.datePaid,
    },
    displayShortDate,
  );
  return {
    ...item,
    ...fields,
    delivered: item.delivered,
    action: paymentActionFor("agency", fields.status),
  };
}

/** Optimistic talent “mark paid”. */
export function markPaid(
  item: PaymentItem,
  today = calendarDay(new Date()),
): PaymentItem {
  const fields = paymentRowFields(
    {
      paymentTerms: item.paymentTerms ?? "net_30",
      dateInvoiced: item.dateInvoicedIso,
      datePaid: today,
    },
    displayDate,
  );
  return {
    ...item,
    ...fields,
    delivered: item.delivered,
    status: "paid",
    statusLabel: DEAL_STATUS_LABELS.paid,
    action: "done",
  };
}

/** Optimistic talent “mark invoiced”. */
export function markInvoiced(
  item: PaymentItem,
  terms: PaymentTerms,
  today = calendarDay(new Date()),
): PaymentItem {
  const fields = paymentRowFields(
    {
      paymentTerms: terms,
      dateInvoiced: today,
      datePaid: null,
    },
    displayDate,
  );
  return {
    ...item,
    ...fields,
    delivered: item.delivered,
    action: paymentActionFor("talent", fields.status),
  };
}
