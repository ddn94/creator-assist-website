"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  LightbulbIcon,
  PlusIcon,
  RowsIcon,
} from "@phosphor-icons/react";

const LEFT_TABS = [
  { href: "/home/tracker", label: "Tracker", Icon: RowsIcon },
  { href: "/home/ideas", label: "Ideas", Icon: LightbulbIcon },
] as const;

const RIGHT_TABS = [
  { href: "/home/payments", label: "Payments", Icon: CurrencyDollarIcon },
  { href: "/home/pnl", label: "P&L", Icon: ChartBarIcon },
] as const;

function Tab({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof RowsIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
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

export function MobileBottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className="fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 md:hidden"
      aria-label="Primary"
    >
      <div className="relative flex items-center rounded-full bg-ink px-3 shadow-[0_8px_24px_rgba(32,37,43,0.35)]">
        {LEFT_TABS.map((tab) => (
          <Tab
            key={tab.href}
            href={tab.href}
            label={tab.label}
            Icon={tab.Icon}
            active={isActive(tab.href)}
          />
        ))}
        <div className="w-16 shrink-0" aria-hidden />
        {RIGHT_TABS.map((tab) => (
          <Tab
            key={tab.href}
            href={tab.href}
            label={tab.label}
            Icon={tab.Icon}
            active={isActive(tab.href)}
          />
        ))}
        <Link
          href="/home/tracker?add=1"
          aria-label="Add content"
          className="absolute left-1/2 top-[-1.25rem] flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_6px_16px_rgba(111,154,134,0.5)] transition-colors hover:bg-primary-hover"
        >
          <PlusIcon size={28} weight="bold" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
