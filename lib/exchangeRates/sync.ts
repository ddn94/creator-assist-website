import { addCalendarDays } from "@/lib/calendarDay";
import { createServiceClient } from "@/lib/supabase/admin";

const HISTORICAL_URL = "https://openexchangerates.org/api/historical";
const MAX_DAYS = 400;

type ProviderPayload = {
  base?: string;
  rates?: Record<string, number>;
};

/** The UTC date that has already closed. A job at 00:15 UTC stores the day before. */
export function completedUtcDate(now = new Date()): string {
  const day = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}

function isDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function eachDate(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    if (dates.length > MAX_DAYS) {
      throw new Error(`Import at most ${MAX_DAYS} days at a time.`);
    }
    cursor = addCalendarDays(cursor, 1);
  }
  return dates;
}

async function fetchDay(appId: string, date: string): Promise<ProviderPayload> {
  const url = new URL(`${HISTORICAL_URL}/${date}.json`);
  url.searchParams.set("app_id", appId);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Open Exchange Rates returned ${response.status} for ${date}.`,
    );
  }
  return (await response.json()) as ProviderPayload;
}

/**
 * Store one closed UTC day, or a backfill range. Existing dates are left as
 * they were: the first write for a date wins.
 */
export async function importExchangeRates(options?: {
  from?: string;
  to?: string;
}): Promise<{ start: string; end: string; imported: number; skipped: number }> {
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID?.trim();
  if (!appId) throw new Error("Missing OPEN_EXCHANGE_RATES_APP_ID.");

  const closed = completedUtcDate();
  let end = options?.to ?? closed;
  const start = options?.from ?? end;
  if (!isDay(start) || !isDay(end)) {
    throw new Error("Dates must be YYYY-MM-DD.");
  }
  if (end > closed) end = closed;
  if (start > end) throw new Error("The start date is after the end date.");

  const admin = createServiceClient();
  let imported = 0;
  let skipped = 0;

  for (const date of eachDate(start, end)) {
    const existing = await admin
      .from("exchange_rates")
      .select("rate_date")
      .eq("currency", "EUR")
      .eq("rate_date", date)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data) {
      skipped += 1;
      continue;
    }

    const payload = await fetchDay(appId, date);
    if (payload.base && payload.base !== "USD") {
      throw new Error(`Expected a USD base for ${date}.`);
    }

    const rows = Object.entries(payload.rates ?? {})
      .filter(
        ([code, value]) =>
          code !== "USD" &&
          /^[A-Z]{3}$/.test(code) &&
          Number.isFinite(value) &&
          value > 0,
      )
      .map(([currency, per_usd]) => ({
        rate_date: date,
        currency,
        per_usd,
      }));
    if (rows.length === 0) throw new Error(`No rates returned for ${date}.`);

    const { error } = await admin.from("exchange_rates").upsert(rows, {
      onConflict: "rate_date,currency",
      ignoreDuplicates: true,
    });
    if (error) throw new Error(error.message);
    imported += 1;
  }

  return { start, end, imported, skipped };
}
