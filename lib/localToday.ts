import { cookies } from "next/headers";
import {
  LOCAL_DAY_COOKIE,
  calendarDay,
  parseCalendarDay,
} from "@/lib/calendarDay";

/** Noon on the person's local calendar day, so due dates follow their day. */
export async function localToday(): Promise<Date> {
  const stored = parseCalendarDay((await cookies()).get(LOCAL_DAY_COOKIE)?.value);
  const day = stored ?? calendarDay(new Date());
  return new Date(`${day}T12:00:00`);
}
