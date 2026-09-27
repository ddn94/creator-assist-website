import type { NavItem } from "@/components/Navbar";

/** Comma-separated emails in ADMIN_EMAILS (e.g. "a@x.com,b@y.com"). */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export const WAITLIST_NAV: NavItem = {
  href: "/admin/waitlist",
  label: "Waitlist",
};

/** Appends the Waitlist nav item when the signed-in email is an admin. */
export function withAdminNav(items: NavItem[], email: string | null | undefined): NavItem[] {
  if (!isAdminEmail(email)) return items;
  if (items.some((item) => item.href === WAITLIST_NAV.href)) return items;
  return [...items, WAITLIST_NAV];
}
