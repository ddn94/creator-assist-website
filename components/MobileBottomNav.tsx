"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useTourPath } from "@/components/TourStage";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  HouseIcon,
  LightbulbIcon,
  PlusIcon,
  RowsIcon,
  UsersIcon,
} from "@phosphor-icons/react";

export type MobileNavRole = "talent" | "agency";

type Tab = {
  href: string;
  label: string;
  Icon: typeof RowsIcon;
  exact?: boolean;
};

type CenterConfig =
  | { mode: "tab"; tab: Tab }
  | { mode: "action"; href: string; label: string; Icon: typeof PlusIcon };

type NavConfig = {
  left: readonly Tab[];
  right: readonly Tab[];
  center: CenterConfig;
};

const NAV: Record<MobileNavRole, NavConfig> = {
  talent: {
    left: [
      { href: "/overview", label: "Overview", Icon: HouseIcon, exact: true },
      { href: "/overview/ideas", label: "Ideas", Icon: LightbulbIcon },
    ],
    right: [
      { href: "/overview/payments", label: "Payments", Icon: CurrencyDollarIcon },
      { href: "/overview/pnl", label: "P&L", Icon: ChartBarIcon },
    ],
    center: {
      mode: "tab",
      tab: { href: "/overview/tracker", label: "Tracker", Icon: RowsIcon },
    },
  },
  agency: {
    left: [
      { href: "/workspace", label: "Overview", Icon: HouseIcon, exact: true },
      { href: "/workspace/talent", label: "Talent", Icon: UsersIcon },
    ],
    right: [
      { href: "/workspace/payments", label: "Payments", Icon: CurrencyDollarIcon },
      { href: "/workspace/pnl", label: "P&L", Icon: ChartBarIcon },
    ],
    center: {
      mode: "action",
      href: "/workspace/talent/new",
      label: "Add talent",
      Icon: PlusIcon,
    },
  },
};

/** Talent and agency both use the floating bottom bar on small screens. */
export function mobileNavRole(
  navItems: { href: string }[],
): MobileNavRole | null {
  if (
    navItems.some(
      (item) => item.href === "/workspace" || item.href.startsWith("/workspace/"),
    )
  ) {
    return "agency";
  }
  if (
    navItems.some(
      (item) => item.href === "/overview" || item.href.startsWith("/overview/"),
    )
  ) {
    return "talent";
  }
  return null;
}

function CenterTab({
  tab,
  active,
  onNavigate,
}: {
  tab: Tab;
  active: boolean;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const Icon = tab.Icon;
  return (
    <Link
      href={tab.href}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      onClick={(event) => onNavigate?.(event, tab.href)}
      className="relative flex w-16 shrink-0 flex-col items-center self-stretch"
    >
      <span
        data-tour-tab={tab.href}
        className="absolute left-1/2 -top-5 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_6px_16px_rgba(111,154,134,0.5)] transition-colors hover:bg-primary-hover"
      >
        <Icon size={26} weight={active ? "fill" : "bold"} aria-hidden />
      </span>
    </Link>
  );
}

function TabLink({
  href,
  label,
  Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: typeof RowsIcon;
  active: boolean;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  return (
    <Link
      href={href}
      data-tour-tab={href}
      onClick={(event) => onNavigate?.(event, href)}
      className={[
        "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 font-display text-[10px] font-semibold transition-colors",
        active ? "text-background" : "text-white/40",
      ].join(" ")}
    >
      <Icon size={22} weight={active ? "fill" : "regular"} aria-hidden />
      {label}
    </Link>
  );
}

export function MobileBottomNav({ role }: { role: MobileNavRole }) {
  const routePath = usePathname();
  const tour = useTourPath();
  const pathname = tour?.path ?? routePath;
  const config = NAV[role];
  const isActive = (tab: Tab) =>
    tab.exact
      ? pathname === tab.href
      : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

  function openTourPage(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!tour?.has(href)) return;
    event.preventDefault();
    tour.setPath(href);
  }

  return (
    <nav
      className="fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 md:hidden"
      aria-label="Primary"
    >
      <div className="relative flex items-center rounded-full bg-ink px-3 shadow-[0_8px_24px_rgba(32,37,43,0.35)]">
        {config.left.map((tab) => (
          <TabLink
            key={tab.href}
            href={tab.href}
            label={tab.label}
            Icon={tab.Icon}
            active={isActive(tab)}
            onNavigate={openTourPage}
          />
        ))}
        {config.center.mode === "tab" ? (
          <CenterTab
            tab={config.center.tab}
            active={isActive(config.center.tab)}
            onNavigate={openTourPage}
          />
        ) : (
          <>
            <div className="w-16 shrink-0" aria-hidden />
            <Link
              href={config.center.href}
              aria-label={config.center.label}
              className="absolute left-1/2 -top-5 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_6px_16px_rgba(111,154,134,0.5)] transition-colors hover:bg-primary-hover"
            >
              <config.center.Icon size={28} weight="bold" aria-hidden />
            </Link>
          </>
        )}
        {config.right.map((tab) => (
          <TabLink
            key={tab.href}
            href={tab.href}
            label={tab.label}
            Icon={tab.Icon}
            active={isActive(tab)}
            onNavigate={openTourPage}
          />
        ))}
      </div>
    </nav>
  );
}
