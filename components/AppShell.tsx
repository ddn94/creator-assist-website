"use client";

import { createContext, use, type ReactNode } from "react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar, type NavItem } from "@/components/Navbar";
import { PageBody } from "@/components/PageBody";
import { PageWrapper } from "@/components/PageWrapper";

export const InsideAppShell = createContext(false);

type AppShellProps = {
  brand: string;
  brandMeta?: string;
  userName: string;
  userEmail?: string;
  avatarUrl?: string | null;
  profileHref: string;
  navItems: NavItem[];
  children: ReactNode;
};

export function AppShell({
  brand,
  brandMeta,
  userName,
  userEmail,
  avatarUrl,
  profileHref,
  navItems,
  children,
}: AppShellProps) {
  const talentMobileNav = brand === "Creator Assist";
  const hasAdminNav = navItems.some((item) => item.href.startsWith("/admin"));

  return (
    <InsideAppShell.Provider value={true}>
      <div className="relative z-10 min-h-dvh bg-background">
        <Navbar
          brand={brand}
          brandMeta={brandMeta}
          items={navItems}
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          profileHref={profileHref}
          hideMobileMenu={talentMobileNav && !hasAdminNav}
        />
        <main
          className={[
            "mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-5",
            talentMobileNav
              ? "pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-6"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </main>
        {talentMobileNav ? <MobileBottomNav /> : null}
      </div>
    </InsideAppShell.Provider>
  );
}

type ShellGateProps = AppShellProps & {
  title?: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
};

/** Inside /home or /workspace the layout already drew the nav. Admin pages draw it here. */
export function ShellGate({
  title,
  description,
  action,
  back,
  children,
  ...chrome
}: ShellGateProps) {
  const nested = use(InsideAppShell);
  if (nested) {
    return (
      <PageBody title={title} description={description} action={action} back={back}>
        {children}
      </PageBody>
    );
  }
  return (
    <PageWrapper
      {...chrome}
      title={title}
      description={description}
      action={action}
      back={back}
    >
      {children}
    </PageWrapper>
  );
}
