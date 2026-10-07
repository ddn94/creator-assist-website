"use client";

import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type TourPathValue = {
  path: string;
  homeHref: string;
  has: (href: string) => boolean;
  setPath: (href: string) => void;
};

const TourPathContext = createContext<TourPathValue | null>(null);

export function useTourPath(): TourPathValue | null {
  return use(TourPathContext);
}

export function TourChrome({
  homeHref,
  startHref,
  hrefs,
  children,
}: {
  homeHref: string;
  startHref: string;
  hrefs: string[];
  children: ReactNode;
}) {
  const live = usePathname();
  const [path, setPathState] = useState(() =>
    hrefs.includes(live) ? live : startHref,
  );

  const setPath = useCallback((href: string) => {
    setPathState(href);
    if (window.location.pathname !== href) {
      window.history.replaceState(window.history.state, "", href);
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    function onPop() {
      const next = window.location.pathname;
      setPathState(hrefs.includes(next) ? next : startHref);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [hrefs, startHref]);

  const has = useCallback((href: string) => hrefs.includes(href), [hrefs]);

  return (
    <TourPathContext.Provider value={{ path, homeHref, has, setPath }}>
      {children}
    </TourPathContext.Provider>
  );
}

/** Shown only on the agency deal step. The id isn't known until the roster loads. */
export function TourDealGate({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const path = useTourPath()?.path;
  return <div hidden={path !== href}>{children}</div>;
}
/** One of these is on screen. The rest stay mounted so the next step is already painted. */
export function TourPanels({
  slots,
}: {
  slots: { href: string; content: ReactNode }[];
}) {
  const tour = useTourPath();
  const path = tour?.path;
  return slots.map((slot) => (
    <div key={slot.href} hidden={slot.href !== path}>
      {slot.content}
    </div>
  ));
}
