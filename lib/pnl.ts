import {
  PNL_BRANDS as BRANDS,
  PNL_CURRENCIES as CURRENCIES,
  PNL_TALENT as TALENT_ROWS,
} from "@/lib/talentMock";

export type PnlPeriod = "month" | "quarter" | "year" | "custom";

export type PnlMetric = {
  label: string;
  value: string;
  tone: "idea" | "collab" | "payment" | "organic" | "background";
  emphasize?: boolean;
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
  billed: string;
  received: string;
  outstanding: string;
  overdue: string | null;
};

export type PnlBrandRow = {
  id: string;
  name: string;
  value: string;
};

export const PNL_PERIODS = [
  { id: "month", label: "This month" },
  { id: "quarter", label: "This quarter" },
  { id: "year", label: "This year" },
  { id: "custom", label: "Custom" },
] as const;

export const PNL_CURRENCIES: PnlCurrencySummary[] = CURRENCIES;
export const PNL_TALENT: PnlTalentRow[] = TALENT_ROWS;
export const PNL_BRANDS: PnlBrandRow[] = BRANDS;
