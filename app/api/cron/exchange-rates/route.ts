import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { importExchangeRates } from "@/lib/exchangeRates/sync";

function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length);
  const provided = Buffer.from(token);
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

/** Vercel Cron calls this daily. A manual call can pass from and to (YYYY-MM-DD) to backfill. */
export async function GET(request: Request) {
  if (!authorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  try {
    const result = await importExchangeRates({ from, to });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
