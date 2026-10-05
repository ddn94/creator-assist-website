import type { Category } from "@/lib/ui";
import type { PaymentStatus } from "@/lib/payments";
import type { ContentType } from "@/lib/tracker";
import { contentCategory, contentPillLabel } from "@/lib/tracker";

export type { PnlPeriod } from "@/lib/pnlRange";
export { PNL_PERIODS } from "@/lib/pnlRange";

/** Agency P&L */

export type PnlMetric = {
  label: string;
  value: string;
  tone: "idea" | "collab" | "payment" | "organic" | "background";
  emphasize?: boolean;
  valueClassName?: string;
};

export type PnlCurrencySummary = {
  id: string;
  name: string;
  talentCount: number;
  metrics: PnlMetric[];
};

export type PnlTalentRow = {
  id: string;
  name: string;
  currency: string;
  revenue: string;
  expenses: string;
  profit: string;
};

export type PnlBrandRow = {
  id: string;
  name: string;
  value: string;
  negative?: boolean;
};

/** Talent P&L */

export type TalentPnlContentRow = {
  id: string;
  contentId: string;
  title: string;
  type: ContentType;
  brand: string | null;
  niche: string | null;
  paymentStatus: PaymentStatus | null;
  paymentLabel: string | null;
  fee: number | null;
  expenses: number;
  profit: number;
  /** Currency the fee and this row's profit are shown in. */
  currency: string;
};

export type TalentPnlBreakdownRow = {
  id: string;
  name: string;
  fee: number;
  expenses: number;
  profit: number;
};

export type TalentPnlSummary = {
  revenue: number;
  expenses: number;
  net: number;
  overdue: number;
  /** Code the three money figures are labeled with. */
  currency: string;
};

export function contentTypeCategory(type: ContentType): Category {
  return contentCategory(type);
}

export function contentTypeLabel(type: ContentType): string {
  return contentPillLabel(type);
}
