"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Min time the tab must be hidden before a focus refresh. */
const HIDDEN_MS = 30_000;
/** Don't refresh more than once within this window. */
const COOLDOWN_MS = 60_000;

/**
 * When the user returns to this browser tab after being away, quietly
 * re-fetch the current page so data updates without a loading skeleton.
 */
export function RefreshOnFocus() {
  const router = useRouter();
  const hiddenAt = useRef<number | null>(null);
  const lastRefresh = useRef(0);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
        return;
      }

      const away = hiddenAt.current;
      hiddenAt.current = null;
      if (away == null) return;

      const now = Date.now();
      if (now - away < HIDDEN_MS) return;
      if (now - lastRefresh.current < COOLDOWN_MS) return;

      lastRefresh.current = now;
      router.refresh();
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [router]);

  return null;
}
