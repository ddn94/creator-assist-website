import { cookies } from "next/headers";
import {
  LOCAL_DAY_COOKIE,
  LOCAL_TZ_COOKIE,
  calendarDay,
  parseCalendarDay,
  parseTimeZone,
} from "@/lib/calendarDay";
import { dayToTimestamp } from "@/lib/timestamps";

/** The person's local calendar day from the browser cookie. */
export async function localDayIso(): Promise<string> {
  const stored = parseCalendarDay(
    (await cookies()).get(LOCAL_DAY_COOKIE)?.value,
  );
  return stored ?? calendarDay(new Date());
}

/** The person's IANA timezone from the browser cookie, when known. */
export async function localTimeZone(): Promise<string | null> {
  const raw = (await cookies()).get(LOCAL_TZ_COOKIE)?.value;
  if (!raw) return null;
  try {
    return parseTimeZone(decodeURIComponent(raw));
  } catch {
    return parseTimeZone(raw);
  }
}

/** Noon on the person's local calendar day, so due dates follow their day. */
export async function localToday(): Promise<Date> {
  const day = await localDayIso();
  const timeZone = await localTimeZone();
  const noon = dayToTimestamp(day, timeZone);
  return noon ? new Date(noon) : new Date(`${day}T12:00:00.000Z`);
}
