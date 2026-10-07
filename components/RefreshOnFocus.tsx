"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Min time the tab must be hidden before a focus refresh. */
const HIDDEN_MS = 30_000;
/** Don't refresh more than once within this window. */
const COOLDOWN_MS = 60_000;
/** Pick up the other side's edits while this tab stays open. */
const INTERVAL_MS = 5 * 60 * 1000;

/**
 * Quietly re-fetch the current page so talent and agency see each other's
 * updates: on a timer while the tab is visible, and when the user returns
 * after being away. No loading skeleton.
 */
export function RefreshOnFocus() {
  const router = useRouter();
  const hiddenAt = useRef<number | null>(null);
  const lastRefresh = useRef(0);

  useEffect(() => {
    function refresh() {
      lastRefresh.current = Date.now();
      router.refresh();
    }

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

      refresh();
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefresh.current < COOLDOWN_MS) return;
      refresh();
    }, INTERVAL_MS);

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return null;
}
