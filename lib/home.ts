import type { NavItem } from "@/components/Navbar";
import type { Category } from "@/lib/ui";
import {
  CONTINUE_ITEMS as FEED,
  OVERVIEW_STATS,
  type ContinueFeedItem,
} from "@/lib/talentMock";

export const talentNav: NavItem[] = [
  { href: "/home", label: "Overview" },
  { href: "/home/tracker", label: "Tracker" },
  { href: "/home/ideas", label: "Ideas" },
  { href: "/home/payments", label: "Payments" },
  { href: "/home/pnl", label: "P&L" },
];

export const talentShell = {
  brand: "Creator Assist",
  userName: "You",
} as const;

export type JumpTile = {
  href: string;
  label: string;
  category: Category;
};

export const JUMP_TILES: JumpTile[] = [
  { href: "/home/tracker", label: "Tracker", category: "organic" },
  { href: "/home/ideas", label: "Ideas", category: "idea" },
  { href: "/home/payments", label: "Payments", category: "payment" },
  { href: "/home/pnl", label: "P&L", category: "paid" },
];

export type ContinueItem = ContinueFeedItem;

export const CONTINUE_ITEMS: ContinueItem[] = FEED;

export { OVERVIEW_STATS };

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
