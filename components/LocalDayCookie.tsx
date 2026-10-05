"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LOCAL_DAY_COOKIE, calendarDay } from "@/lib/calendarDay";

function cookieDay() {
  const row = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${LOCAL_DAY_COOKIE}=`));
  return row?.slice(LOCAL_DAY_COOKIE.length + 1) ?? "";
}

/** Remember the browser's calendar day so the server can use it for due dates. */
export function LocalDayCookie() {
  const router = useRouter();

  useEffect(() => {
    const day = calendarDay(new Date());
    if (cookieDay() === day) return;
    document.cookie = `${LOCAL_DAY_COOKIE}=${day}; path=/; max-age=172800; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
