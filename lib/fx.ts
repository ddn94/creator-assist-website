/** Approximate units of each currency per 1 USD. Used to show agency totals in one currency. */
const PER_USD: Record<string, number> = {
  AED: 3.67,
  AFN: 70,
  ALL: 93,
  AMD: 388,
  AOA: 920,
  ARS: 1050,
  AUD: 1.52,
  AZN: 1.7,
  BAM: 1.8,
  BBD: 2,
  BDT: 120,
  BHD: 0.38,
  BIF: 2950,
  BND: 1.34,
  BOB: 6.9,
  BRL: 5.4,
  BSD: 1,
  BTN: 84,
  BWP: 13.5,
  BYN: 3.3,
  BZD: 2,
  CAD: 1.36,
  CHF: 0.88,
  CLP: 950,
  CNY: 7.2,
  COP: 4100,
  CRC: 510,
  CUP: 24,
  CVE: 102,
  CZK: 23,
  DJF: 178,
  DKK: 6.9,
  DOP: 60,
  DZD: 134,
  EGP: 49,
  ERN: 15,
  ETB: 125,
  EUR: 0.92,
  FJD: 2.25,
  GBP: 0.79,
  GEL: 2.7,
  GHS: 15,
  GMD: 71,
  GNF: 8650,
  GTQ: 7.7,
  GYD: 209,
  HKD: 7.8,
  HNL: 25,
  HTG: 132,
  HUF: 365,
  IDR: 15800,
  ILS: 3.7,
  INR: 84,
  IQD: 1310,
  IRR: 42000,
  ISK: 137,
  JMD: 157,
  JOD: 0.71,
  JPY: 149,
  KES: 129,
  KGS: 87,
  KHR: 4050,
  KMF: 455,
  KRW: 1380,
  KWD: 0.31,
  KZT: 490,
  LAK: 21700,
  LBP: 89500,
  LKR: 300,
  LRD: 190,
  LSL: 18,
  LYD: 4.8,
  MAD: 10,
  MDL: 17.8,
  MGA: 4550,
  MKD: 56,
  MMK: 2100,
  MNT: 3400,
  MOP: 8,
  MRU: 40,
  MUR: 46,
  MVR: 15.4,
  MWK: 1730,
  MXN: 18,
  MYR: 4.4,
  MZN: 64,
  NAD: 18,
  NGN: 1550,
  NIO: 36.8,
  NOK: 10.8,
  NPR: 134,
  NZD: 1.67,
  OMR: 0.38,
  PAB: 1,
  PEN: 3.7,
  PGK: 3.9,
  PHP: 58,
  PKR: 278,
  PLN: 4,
  PYG: 7800,
  QAR: 3.64,
  RON: 4.6,
  RSD: 108,
  RUB: 92,
  RWF: 1380,
  SAR: 3.75,
  SBD: 8.4,
  SCR: 14,
  SDG: 600,
  SEK: 10.5,
  SGD: 1.34,
  SLE: 22.5,
  SOS: 570,
  SRD: 35,
  SSP: 130,
  STN: 22.6,
  SYP: 13000,
  SZL: 18,
  THB: 34,
  TJS: 10.9,
  TMT: 3.5,
  TND: 3.1,
  TOP: 2.35,
  TRY: 34,
  TTD: 6.8,
  TWD: 32,
  TZS: 2650,
  UAH: 41,
  UGX: 3700,
  USD: 1,
  UYU: 42,
  UZS: 12800,
  VES: 45,
  VND: 25400,
  VUV: 120,
  WST: 2.75,
  XAF: 605,
  XCD: 2.7,
  XOF: 605,
  YER: 250,
  ZAR: 18,
  ZMW: 27,
};

export function moneyCode(
  code: string | null | undefined,
  fallback = "USD",
): string {
  const value = code?.trim().toUpperCase() ?? "";
  return value || fallback;
}

/** One stored USD cross rate. `perUsd` is units of `currency` for 1 USD. */
export type RatePoint = {
  date: string;
  perUsd: number;
};

/** Historical rates grouped by currency, each list sorted by date ascending. */
export type RateBook = {
  byCurrency: Record<string, RatePoint[]>;
};

export const EMPTY_RATE_BOOK: RateBook = { byCurrency: {} };

/**
 * Onboarding currency first, then every other code actually stored on a deal or expense.
 */
export function usedCurrencyCodes(
  home: string,
  items: {
    deal?: { currency?: string | null } | null;
    expenses?: { currency?: string | null }[];
  }[],
): string[] {
  const first = moneyCode(home);
  const rest = new Set<string>();
  for (const item of items) {
    const deal = item.deal?.currency?.trim().toUpperCase();
    if (deal) rest.add(deal);
    for (const expense of item.expenses ?? []) {
      const code = expense.currency?.trim().toUpperCase();
      if (code) rest.add(code);
    }
  }
  rest.delete(first);
  return [first, ...[...rest].sort()];
}

function staticPerUsd(code: string): number {
  return PER_USD[code] ?? 1;
}

/**
 * Latest stored rate on or before `date`. A later day's rate is never used.
 * Missing history falls back to the static table in the caller.
 */
export function perUsdOn(
  book: RateBook,
  currency: string,
  date: string,
): number | null {
  const code = moneyCode(currency);
  if (code === "USD") return 1;
  const rows = book.byCurrency[code];
  if (!rows?.length) return null;
  const day = date.slice(0, 10);
  let found: number | null = null;
  for (const row of rows) {
    if (row.date <= day) found = row.perUsd;
    else break;
  }
  return found;
}

/** Convert using both currencies' rates on the transaction date. */
export function convertOnDate(
  amount: number,
  from: string,
  to: string,
  date: string,
  book: RateBook = EMPTY_RATE_BOOK,
): number {
  const source = moneyCode(from);
  const target = moneyCode(to);
  if (source === target || !Number.isFinite(amount)) return amount;
  const sourcePerUsd = perUsdOn(book, source, date) ?? staticPerUsd(source);
  const targetPerUsd = perUsdOn(book, target, date) ?? staticPerUsd(target);
  return (amount / sourcePerUsd) * targetPerUsd;
}

/** Sum amounts that share one code as-is. Mixed codes convert into the fallback. */
export function totalInCurrency(
  parts: { amount: number; currency?: string | null }[],
  fallback: string,
): { amount: number; currency: string } {
  const home = moneyCode(fallback);
  const codes = new Set(parts.map((part) => moneyCode(part.currency, home)));
  if (codes.size <= 1) {
    return {
      amount: parts.reduce((sum, part) => sum + part.amount, 0),
      currency: [...codes][0] ?? home,
    };
  }
  return {
    amount: parts.reduce(
      (sum, part) =>
        sum + convertAmount(part.amount, moneyCode(part.currency, home), home),
      0,
    ),
    currency: home,
  };
}

export function convertAmount(amount: number, from: string, to: string): number {
  const source = from?.toUpperCase() || "USD";
  const target = to?.toUpperCase() || "USD";
  if (source === target) return amount;
  const sourcePerUsd = PER_USD[source] ?? 1;
  const targetPerUsd = PER_USD[target] ?? 1;
  return (amount / sourcePerUsd) * targetPerUsd;
}
