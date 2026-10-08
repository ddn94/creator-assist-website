import type { UserRole } from "@/lib/auth/types";

export type TourStep = {
  id: string;
  /** Static path. Agency deal step reads the roster row instead. */
  href: string | null;
  matches: (pathname: string) => boolean;
  target: string;
  fallback: string;
  /** Nav href to spotlight with this step. Same on desktop and the mobile bar. */
  tab: string;
  title: string;
  body: string;
};

const talentSteps: TourStep[] = [
  {
    id: "content",
    href: "/overview/tracker",
    matches: (pathname) => pathname === "/overview/tracker",
    target: "tour-content",
    fallback: "tour-content-fallback",
    tab: "/overview/tracker",
    title: "Content",
    body: "Every piece of content lives here. Add yours and move it from Concept to Go Live.",
  },
  {
    id: "idea",
    href: "/overview/ideas",
    matches: (pathname) => pathname === "/overview/ideas",
    target: "tour-idea",
    fallback: "tour-idea-fallback",
    tab: "/overview/ideas",
    title: "Ideas",
    body: "This is an idea. Dump hooks and half-formed thoughts here before they become content.",
  },
  {
    id: "payments",
    href: "/overview/payments",
    matches: (pathname) => pathname === "/overview/payments",
    target: "tour-payments",
    fallback: "tour-payments-fallback",
    tab: "/overview/payments",
    title: "Payments",
    body: "Paid collabs show up here: what’s owed, what’s invoiced, and what’s been paid.",
  },
  {
    id: "pnl",
    href: "/overview/pnl",
    matches: (pathname) => pathname === "/overview/pnl",
    target: "tour-pnl",
    fallback: "tour-pnl-fallback",
    tab: "/overview/pnl",
    title: "P&L",
    body: "Your profit and loss: what came in, what went out, what’s left.",
  },
];

const agencySteps: TourStep[] = [
  {
    id: "roster",
    href: "/workspace/talent",
    matches: (pathname) => pathname === "/workspace/talent",
    target: "tour-roster",
    fallback: "tour-roster",
    tab: "/workspace/talent",
    title: "Talent",
    body: "Someone on your roster. You can track their deals before they join.",
  },
  {
    id: "deal",
    href: null,
    matches: (pathname) =>
      /^\/workspace\/talent\/(?!new$)[^/]+$/.test(pathname),
    target: "tour-deal",
    fallback: "tour-deal",
    tab: "/workspace/talent",
    title: "Deal",
    body: "A deal you've logged for them. Once they join, it shows up on their side too.",
  },
  {
    id: "payments",
    href: "/workspace/payments",
    matches: (pathname) => pathname === "/workspace/payments",
    target: "tour-payments",
    fallback: "tour-payments-fallback",
    tab: "/workspace/payments",
    title: "Payments",
    body: "Every deal across the roster lands here. You set invoice dates and terms.",
  },
  {
    id: "pnl",
    href: "/workspace/pnl",
    matches: (pathname) => pathname === "/workspace/pnl",
    target: "tour-pnl",
    fallback: "tour-pnl-fallback",
    tab: "/workspace/pnl",
    title: "P&L",
    body: "This is profit and loss across the roster: revenue, expenses, and what’s left.",
  },
];

export function tourSteps(role: UserRole): TourStep[] {
  return role === "agency" ? agencySteps : talentSteps;
}

/** First tooltip page. New accounts land here instead of the overview. */
export function tourStartPath(role: UserRole): string {
  return tourSteps(role)[0].href ?? (role === "agency" ? "/workspace/talent" : "/overview/tracker");
}

export const TOUR_STEP_KEY = "ca-product-tour-step";
export const TOUR_HREF_KEY = "ca-product-tour-href";
export const TOUR_CLOSED_KEY = "ca-product-tour-closed";
/** Route to open for real once the tour UI has already switched. */
export const TOUR_HANDOFF_KEY = "ca-product-tour-handoff";
