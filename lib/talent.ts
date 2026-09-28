import type { StatusTagTone } from "@/components/StatusTag";
import {
  attentionPaymentStatus,
  paymentStatusTone,
  type AttentionPaymentStatus,
} from "@/lib/payments";
import type { PaymentTerms } from "@/lib/tracker";

export type TalentStatus = "active" | "invited" | "record";

export type TalentItem = {
  id: string;
  name: string;
  email: string | null;
  status: TalentStatus;
  statusLabel: string;
  platforms: string;
  platformsFull: string;
  community: string;
  niches: string;
  location: string;
  liveDeals: string | null;
  outstanding: string | null;
  lastActivity: string;
  avatarUrl: string | null;
};

/** Profile deal list only surfaces open invoices. */
export type DealPayment = AttentionPaymentStatus;

export const toDealPayment = attentionPaymentStatus;

export type TalentDeal = {
  id: string;
  content: string;
  brand: string | null;
  platform: string;
  fee: string | null;
  stage: string;
  payment: DealPayment;
  paymentLabel: string | null;
};

export type TalentInvoicing = {
  contentId: string;
  dealTitle: string;
  summary: string;
  dateInvoiced: string;
  paymentTerms: PaymentTerms;
  datePaid: string;
  dueNote: string;
};

export type TalentActivityItem = {
  id: string;
  title: string;
  detail: string;
  when: string;
};

export type TalentDetail = TalentItem & {
  firstName: string;
  notes: string | null;
  deals: TalentDeal[];
  invoicing: TalentInvoicing | null;
  activity: TalentActivityItem[];
};

export const talentStatusTone: Record<TalentStatus, StatusTagTone> = {
  active: "active",
  invited: "invited",
  record: "record",
};

export const dealPaymentTone: Record<
  Exclude<DealPayment, null>,
  StatusTagTone
> = {
  overdue: paymentStatusTone.overdue,
  awaiting_payment: paymentStatusTone.awaiting_payment,
};
