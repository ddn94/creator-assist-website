"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LOCAL_DAY_COOKIE,
  LOCAL_TZ_COOKIE,
  calendarDay,
} from "@/lib/calendarDay";

function cookieValue(name: string) {
  const row = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  const raw = row?.slice(name.length + 1) ?? "";
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Remember the browser's day and timezone so the server can use them. */
export function LocalDayCookie() {
  const router = useRouter();

  useEffect(() => {
    const day = calendarDay(new Date());
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const sameDay = cookieValue(LOCAL_DAY_COOKIE) === day;
    const sameZone = !timeZone || cookieValue(LOCAL_TZ_COOKIE) === timeZone;
    if (sameDay && sameZone) return;
    document.cookie = `${LOCAL_DAY_COOKIE}=${day}; path=/; max-age=172800; samesite=lax`;
    if (timeZone) {
      document.cookie = `${LOCAL_TZ_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=172800; samesite=lax`;
    }
    router.refresh();
  }, [router]);

  return null;
}
