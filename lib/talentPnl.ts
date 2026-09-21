import type { Category } from "@/lib/ui";
import { paymentStatusTone } from "@/lib/payments";
import type { ContentType } from "@/lib/tracker";
import { contentCategory, contentPillLabel } from "@/lib/tracker";
import {
  TALENT_PNL_BY_BRAND,
  TALENT_PNL_BY_NICHE,
  TALENT_PNL_ROWS,
  TALENT_PNL_SUMMARY,
  type TalentPnlBreakdownRow,
  type TalentPnlContentRow,
  type TalentPnlSummary,
} from "@/lib/talentMock";

export type TalentPnlRange = "month" | "quarter" | "custom";

export const TALENT_PNL_RANGES: { id: TalentPnlRange; label: string }[] = [
  { id: "month", label: "This month" },
  { id: "quarter", label: "This quarter" },
  { id: "custom", label: "Custom" },
];

export type { TalentPnlContentRow, TalentPnlBreakdownRow, TalentPnlSummary };

export function contentTypeCategory(type: ContentType): Category {
  return contentCategory(type);
}

export function contentTypeLabel(type: ContentType): string {
  return contentPillLabel(type);
}

export { paymentStatusTone };

export function fmtMoney(amount: number): string {
  const abs = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  if (amount < 0) return `-$${abs}`;
  return `$${abs}`;
}

export {
  TALENT_PNL_SUMMARY,
  TALENT_PNL_ROWS,
  TALENT_PNL_BY_BRAND,
  TALENT_PNL_BY_NICHE,
};
