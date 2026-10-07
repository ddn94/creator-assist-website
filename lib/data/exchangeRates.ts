import { createClient } from "@/lib/supabase/server";
import {
  EMPTY_RATE_BOOK,
  usedCurrencyCodes,
  type RateBook,
  type RatePoint,
} from "@/lib/fx";

/** Rates for the currencies this P&L can display. Empty when the table is not ready yet. */
export async function loadRateBook(currencies: string[]): Promise<RateBook> {
  const codes = [
    ...new Set(
      currencies
        .map((code) => code.trim().toUpperCase())
        .filter((code) => code && code !== "USD"),
    ),
  ];
  if (codes.length === 0) return EMPTY_RATE_BOOK;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("rate_date, currency, per_usd")
      .in("currency", codes)
      .order("rate_date", { ascending: true });
    if (error || !data) return EMPTY_RATE_BOOK;

    const byCurrency: Record<string, RatePoint[]> = {};
    for (const row of data) {
      const code = typeof row.currency === "string" ? row.currency : "";
      const date = String(row.rate_date ?? "").slice(0, 10);
      const perUsd = Number(row.per_usd);
      if (!code || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      if (!Number.isFinite(perUsd) || perUsd <= 0) continue;
      const list = byCurrency[code] ?? [];
      list.push({ date, perUsd });
      byCurrency[code] = list;
    }
    return { byCurrency };
  } catch {
    return EMPTY_RATE_BOOK;
  }
}

export async function pnlMoneyContext(
  home: string,
  items: Parameters<typeof usedCurrencyCodes>[1],
) {
  const currencies = usedCurrencyCodes(home, items);
  const rates = await loadRateBook(currencies);
  return { currencies, rates };
}
