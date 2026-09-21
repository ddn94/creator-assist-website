"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SignOutIcon, UserIcon } from "@phosphor-icons/react";
import { resetMockDb } from "@/lib/mockStore";
import { Avatar } from "@/components/Avatar";
import { Text } from "@/components/Text";
import { useSelfProfile } from "@/lib/useMockDb";

export type NavItem = {
  href: string;
  label: string;
};

type NavbarProps = {
  brand: string;
  brandMeta?: string;
  items: NavItem[];
  userName: string;
  userEmail?: string;
  /** When true, skip hamburger + drawer (bottom bar handles primary nav). */
  hideMobileMenu?: boolean;
};

function isNavItemActive(pathname: string, href: string, items: NavItem[]) {
  const matches = items.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return false;
  const best = matches.reduce((a, b) =>
    a.href.length >= b.href.length ? a : b,
  );
  return best.href === href;
}

export function Navbar({
  brand,
  brandMeta,
  items,
  userName,
  userEmail,
  hideMobileMenu = false,
}: NavbarProps) {
  const pathname = usePathname();
  const liveProfile = useSelfProfile();
  const isTalent = brand === "Creator Assist";
  const displayName = isTalent ? liveProfile.name : userName;
  const displayEmail = isTalent
    ? (liveProfile.email ?? userEmail)
    : userEmail;
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuId = useId();

  useEffect(() => {
    if (!userMenuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setUserMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  return (
    <header className="relative border-b border-card-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-4 lg:px-5">
        <Link href={items[0]?.href ?? "/"} className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-[10px]"
            priority
          />
          <span className="min-w-0">
            <Text variant="title" className="truncate text-sm sm:text-base">
              {brand}
            </Text>
            {brandMeta ? (
              <Text variant="caption" className="truncate">
                {brandMeta}
              </Text>
            ) : null}
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-start gap-1 px-6 md:flex">
          {items.map((item) => {
            const active = isNavItemActive(pathname, item.href, items);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-full px-3.5 py-2 font-display text-sm font-semibold transition-colors",
                  active
                    ? "bg-card text-ink shadow-card"
                    : "text-muted hover:text-ink",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 md:ml-0">
          <Text variant="nav" className="hidden truncate sm:inline">
            {displayName}
          </Text>
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-controls={userMenuId}
              aria-label="User menu"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="rounded-full outline-none"
            >
              <Avatar name={displayName} size="sm" />
            </button>
            {userMenuOpen ? (
              <div
                id={userMenuId}
                role="menu"
                className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-card-border bg-card shadow-card"
              >
                <Link
                  href="/home/profile"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-background"
                >
                  <UserIcon
                    size={16}
                    weight="regular"
                    className="mt-0.5 shrink-0 text-ink"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <Text
                      variant="cardTitle"
                      className="truncate text-xs font-medium"
                    >
                      {displayName}
                    </Text>
                    {displayEmail ? (
                      <Text
                        variant="caption"
                        className="mt-0.5 truncate text-xxs"
                      >
                        {displayEmail}
                      </Text>
                    ) : null}
                  </div>
                </Link>
                <div className="border-t border-card-border" />
                <Link
                  href="/login"
                  role="menuitem"
                  onClick={() => {
                    resetMockDb();
                    setUserMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-background"
                >
                  <SignOutIcon size={16} weight="regular" aria-hidden />
                  Sign out
                </Link>
              </div>
            ) : null}
          </div>
          {!hideMobileMenu ? (
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-ink md:hidden"
              aria-expanded={open}
              aria-label="Menu"
              onClick={() => setOpen((prev) => !prev)}
            >
              <span aria-hidden className="font-display text-lg leading-none">
                {open ? "×" : "☰"}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {open && !hideMobileMenu ? (
        <nav className="border-t border-card-border px-3 py-2 sm:px-4 md:hidden">
          <div className="flex flex-col gap-1">
            {items.map((item) => {
              const active = isNavItemActive(pathname, item.href, items);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "rounded-full px-3.5 py-2.5 font-display text-sm font-semibold",
                    active
                      ? "bg-card text-ink shadow-card"
                      : "text-muted hover:text-ink",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
