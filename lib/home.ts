import type { NavItem } from "@/components/Navbar";
import type { Category } from "@/lib/ui";

export const talentNav: NavItem[] = [
  { href: "/overview", label: "Overview" },
  { href: "/overview/tracker", label: "Tracker" },
  { href: "/overview/ideas", label: "Ideas" },
  { href: "/overview/payments", label: "Payments" },
  { href: "/overview/pnl", label: "P&L" },
];

export type JumpTile = {
  href: string;
  label: string;
  category: Category;
};

export const JUMP_TILES: JumpTile[] = [
  { href: "/overview/tracker", label: "Tracker", category: "organic" },
  { href: "/overview/ideas", label: "Ideas", category: "idea" },
  { href: "/overview/payments", label: "Payments", category: "payment" },
  { href: "/overview/pnl", label: "P&L", category: "paid" },
];

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
