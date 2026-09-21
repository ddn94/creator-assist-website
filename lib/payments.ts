import type { StatusTagTone } from "@/components/StatusTag";
import { PAYMENTS as FROM_STORE } from "@/lib/talentMock";

export type PaymentStatus =
  | "overdue"
  | "awaiting"
  | "notInvoiced"
  | "paid";

export type PaymentItem = {
  id: string;
  talentName: string;
  content: string;
  brand: string;
  platform: string;
  fee: string;
  terms: string | null;
  /** Raw deal fields for editing */
  paymentTerms: string | null;
  dateInvoicedIso: string | null;
  delivered: string | null;
  invoiced: string | null;
  due: string | null;
  status: PaymentStatus;
  statusLabel: string;
  paid: string | null;
  action: "edit" | "setInvoice";
};

export const paymentStatusTone: Record<PaymentStatus, StatusTagTone> = {
  overdue: "overdue",
  awaiting: "awaiting",
  notInvoiced: "notInvoiced",
  paid: "paid",
};

export const PAYMENTS: PaymentItem[] = FROM_STORE;
