import type { NavItem } from "@/components/Navbar";

export const workspaceNav: NavItem[] = [
  { href: "/workspace", label: "Overview" },
  { href: "/workspace/talent", label: "Talent" },
  { href: "/workspace/payments", label: "Payments" },
  { href: "/workspace/pnl", label: "P&L" },
];

export const workspaceShell = {
  brand: "Workspace",
  brandMeta: "Agency workspace",
  userName: "You",
} as const;
