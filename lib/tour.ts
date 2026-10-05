import type { UserRole } from "@/lib/auth/types";

export type TourStep = {
  id: string;
  /** Static path. Agency deal step reads the roster row instead. */
  href: string | null;
  matches: (pathname: string) => boolean;
  target: string;
  fallback: string;
  title: string;
  body: string;
};

const talentSteps: TourStep[] = [
  {
    id: "content",
    href: "/home/tracker",
    matches: (pathname) => pathname === "/home/tracker",
    target: "tour-content",
    fallback: "tour-content-fallback",
    title: "Content",
    body: "This is a piece of content. Add your own here and move it from Concept to Go Live.",
  },
  {
    id: "idea",
    href: "/home/ideas",
    matches: (pathname) => pathname === "/home/ideas",
    target: "tour-idea",
    fallback: "tour-idea-fallback",
    title: "Ideas",
    body: "This is an idea. Dump hooks and half-formed thoughts here before they become content.",
  },
  {
    id: "payments",
    href: "/home/payments",
    matches: (pathname) => pathname === "/home/payments",
    target: "tour-payments",
    fallback: "tour-payments-fallback",
    title: "Payments",
    body: "Paid collabs show up here: what’s owed, what’s invoiced, and what’s been paid.",
  },
  {
    id: "pnl",
    href: "/home/pnl",
    matches: (pathname) => pathname === "/home/pnl",
    target: "tour-pnl",
    fallback: "tour-pnl-fallback",
    title: "P&L",
    body: "This is profit and loss: revenue, expenses, and what’s left.",
  },
];

const agencySteps: TourStep[] = [
  {
    id: "roster",
    href: "/workspace/talent",
    matches: (pathname) => pathname === "/workspace/talent",
    target: "tour-roster",
    fallback: "tour-roster",
    title: "Talent",
    body: "This is someone on your roster. You can track a record before they join.",
  },
  {
    id: "deal",
    href: null,
    matches: (pathname) =>
      /^\/workspace\/talent\/(?!new$)[^/]+$/.test(pathname),
    target: "tour-deal",
    fallback: "tour-deal",
    title: "Deal",
    body: "This is a deal logged for them. After they create an account, it shows up in theirs.",
  },
  {
    id: "payments",
    href: "/workspace/payments",
    matches: (pathname) => pathname === "/workspace/payments",
    target: "tour-payments",
    fallback: "tour-payments-fallback",
    title: "Payments",
    body: "Every deal across the roster lands here. You set invoice dates and terms.",
  },
  {
    id: "pnl",
    href: "/workspace/pnl",
    matches: (pathname) => pathname === "/workspace/pnl",
    target: "tour-pnl",
    fallback: "tour-pnl-fallback",
    title: "P&L",
    body: "This is profit and loss across the roster: revenue, expenses, and what’s left.",
  },
];

export function tourSteps(role: UserRole): TourStep[] {
  return role === "agency" ? agencySteps : talentSteps;
}

export const TOUR_STEP_KEY = "ca-product-tour-step";
export const TOUR_HREF_KEY = "ca-product-tour-href";
