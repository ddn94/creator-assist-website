import type { StatusTagTone } from "@/components/StatusTag";
import {
  getTalentById as getFromStore,
  TALENT as FROM_STORE,
} from "@/lib/talentMock";

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
};

export type DealPayment = "overdue" | "awaiting" | null;

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
  dealTitle: string;
  summary: string;
  dateInvoiced: string;
  paymentTerms: string;
  datePaid: string;
  datePaidHint: string;
  dueNote: string;
};

export type TalentActivityItem = {
  id: string;
  title: string;
  meta: string;
};

export type TalentDetail = TalentItem & {
  firstName: string;
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
  overdue: "overdue",
  awaiting: "awaiting",
};

export const TALENT: TalentItem[] = FROM_STORE;

export function getTalentById(id: string): TalentDetail | null {
  return getFromStore(id);
}
