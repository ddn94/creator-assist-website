import type { ReactNode } from "react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar, type NavItem } from "@/components/Navbar";
import { PageHeader } from "@/components/PageHeader";

type PageWrapperProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
  brand: string;
  brandMeta?: string;
  userName: string;
  userEmail?: string;
  navItems: NavItem[];
  children: ReactNode;
};

export function PageWrapper({
  title,
  description,
  action,
  back,
  brand,
  brandMeta,
  userName,
  userEmail,
  navItems,
  children,
}: PageWrapperProps) {
  const talentMobileNav = brand === "Creator Assist";

  return (
    <div className="relative z-10 min-h-dvh bg-background">
      <Navbar
        brand={brand}
        brandMeta={brandMeta}
        items={navItems}
        userName={userName}
        userEmail={userEmail}
        hideMobileMenu={talentMobileNav}
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
        {title ? (
          <>
            <PageHeader
              title={title}
              description={description}
              action={action}
              back={back}
            />
            <div className="mt-6 sm:mt-8">{children}</div>
          </>
        ) : (
          children
        )}
      </main>
      {talentMobileNav ? <MobileBottomNav /> : null}
    </div>
  );
}

