import type { AttentionItem } from "@/components/NeedsAttentionList";
import type { RosterItem } from "@/components/RosterList";
import type { Category } from "@/lib/ui";
import type { AgeBracket } from "@/lib/onboarding";
import { ONBOARDING_PLATFORMS } from "@/lib/onboarding";
import type { PaymentStatus } from "@/lib/payments";
import type {
  DealPayment,
  TalentActivityItem,
  TalentDeal,
  TalentDetail,
  TalentInvoicing,
  TalentItem,
  TalentStatus,
} from "@/lib/talent";
import type {
  PnlBrandRow,
  PnlCurrencySummary,
  PnlTalentRow,
} from "@/lib/pnl";
import type { PaymentItem } from "@/lib/payments";
import type { TalentProfileData } from "@/lib/profile";
import {
  bindMockSeeds,
  getMockContent,
  getMockCreators,
  getMockIdeas,
} from "@/lib/mockStore";
import {
  dateInPnlRange,
  resolvePnlBounds,
  type PnlDateFilter,
} from "@/lib/pnlRange";
import {
  DELIVERABLE_TYPE_LABELS,
  DEAL_STATUS_LABELS,
  STAGE_LABELS,
  TERM_LABELS,
  computeDealStatus,
  computeDueDate,
  contentCategory,
  contentPillLabel,
  formatLiveDate,
  fmtMoney,
  type DealStatus,
  type PaymentTerms,
  type Stage,
  type TrackerDetail,
  type TrackerItem,
} from "@/lib/tracker";

/**
 * Shared mock database for talent (/home) and agency (/workspace) surfaces.
 * Tables: CREATORS, CONTENT, IDEAS, ACTIVITY — mutable rows live in mockStore.
 */

export const SELF_CREATOR_ID = "fatima";
export const AGENCY_ID = "bright";

export type CurrencyCode = "USD" | "GBP" | "EUR";

export type CreatorPlatform = {
  id: string;
  platform: string;
  followers: number;
  category: Category;
  handle?: string | null;
};

export type Creator = {
  id: string;
  name: string;
  email: string | null;
  status: TalentStatus;
  agencyId: string | null;
  platforms: CreatorPlatform[];
  niches: string[];
  location: string;
  currency: CurrencyCode;
  lastActivity: string;
  ageBracket?: AgeBracket;
  /** ISO date — used for profile “Member since …” */
  joinedAt?: string;
};

export type IdeaStatus = "idea" | "in_progress" | "used";

export type IdeaItem = {
  id: string;
  creatorId: string;
  title: string;
  body: string;
  tags: string[];
  status: IdeaStatus;
  createdAt: string;
  linkedContentItemId: string | null;
};

export type TalentPaymentAction = "markPaid" | "markInvoiced" | "done" | "none";

export type TalentPaymentItem = {
  id: string;
  contentId: string;
  content: string;
  platform: string;
  brand: string;
  fee: string;
  deliverables: string;
  terms: PaymentTerms | null;
  termsLabel: string | null;
  delivered: string | null;
  invoiced: string | null;
  due: string | null;
  status: PaymentStatus;
  statusLabel: string;
  paid: string | null;
  action: TalentPaymentAction;
};

export type TalentPnlContentRow = {
  id: string;
  contentId: string;
  title: string;
  type: TrackerDetail["type"];
  brand: string | null;
  niche: string | null;
  paymentStatus: PaymentStatus | null;
  paymentLabel: string | null;
  fee: number | null;
  expenses: number;
  profit: number;
};

export type TalentPnlBreakdownRow = {
  id: string;
  name: string;
  fee: number;
  expenses: number;
  profit: number;
};

export type TalentPnlSummary = {
  revenue: number;
  expenses: number;
  net: number;
  overdue: number;
};

export type ContinueFeedItem = {
  id: string;
  title: string;
  category: Category;
  pill: string;
  meta: string;
  href: string;
};

export type OverviewStats = {
  inProgress: number;
  paymentsDue: number;
  revenue: string;
  dueThisWeek: string;
};

export type AgencyOverviewStats = {
  talentCount: number;
  talentFooter: string;
  outstanding: string;
  outstandingFooter: string;
  overdue: string;
  overdueFooter: string;
  received: string;
  receivedFooter: string;
  description: string;
};

// ---------- helpers ----------

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
};

function fmtCurrency(amount: number, currency: CurrencyCode): string {
  const abs = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const sign = amount < 0 ? "-" : "";
  return `${sign}${CURRENCY_SYMBOL[currency]}${abs}`;
}

function fmtCommunity(followers: number): string {
  if (followers <= 0) return "0";
  if (followers >= 1000) {
    const k = followers / 1000;
    const rounded = k >= 10 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, "");
    return `${rounded}k`;
  }
  return String(followers);
}

function shortPlatform(platform: string): string {
  if (platform === "Instagram") return "IG";
  if (platform === "YouTube") return "YT";
  return platform;
}

function platformsShort(platforms: CreatorPlatform[]): string {
  return platforms.map((p) => shortPlatform(p.platform)).join(" · ");
}

function platformsFull(platforms: CreatorPlatform[]): string {
  return platforms.map((p) => p.platform).join(", ");
}

function totalFollowers(platforms: CreatorPlatform[]): number {
  return platforms.reduce((sum, p) => sum + p.followers, 0);
}

function dealStatusToPayment(status: DealStatus): PaymentStatus {
  switch (status) {
    case "not_invoiced":
      return "notInvoiced";
    case "awaiting_payment":
      return "awaiting";
    case "overdue":
      return "overdue";
    case "paid":
      return "paid";
  }
}

function toDealPayment(status: DealStatus): DealPayment {
  if (status === "overdue") return "overdue";
  if (status === "awaiting_payment") return "awaiting";
  return null;
}

function formatDeliverables(
  deliverables: NonNullable<TrackerDetail["deal"]>["deliverables"],
): string {
  return deliverables
    .map((d) => `${d.quantity}× ${DELIVERABLE_TYPE_LABELS[d.type]}`)
    .join(" · ");
}

function displayDate(iso: string | null): string | null {
  return iso ? formatLiveDate(iso) : null;
}

function displayShortDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function daysBetween(fromIso: string, to = new Date()): number {
  const from = new Date(`${fromIso}T12:00:00`);
  const today = new Date(`${to.toISOString().slice(0, 10)}T12:00:00`);
  return Math.round((today.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function creatorById(id: string): Creator | undefined {
  return getMockCreators().find((c) => c.id === id) as Creator | undefined;
}

// ---------- tables ----------

export const CREATORS: Creator[] = [
  {
    id: "fatima",
    name: "Fatima",
    email: "fatimawhd.dev@gmail.com",
    status: "active",
    agencyId: null,
    ageBracket: "25_34",
    joinedAt: "2026-09-01",
    platforms: [
      {
        id: "ig",
        platform: "Instagram",
        followers: 0,
        category: "organic",
        handle: "",
      },
    ],
    niches: ["Beauty", "Fashion", "Lifestyle"],
    location: "Remote, USD",
    currency: "USD",
    lastActivity: "Today",
  },
  {
    id: "dani",
    name: "Dani Nicholls",
    email: "dani@galcrew.com",
    status: "active",
    agencyId: AGENCY_ID,
    platforms: [
      { id: "ig", platform: "Instagram", followers: 22000, category: "organic" },
      { id: "tt", platform: "TikTok", followers: 18200, category: "idea" },
      { id: "yt", platform: "YouTube", followers: 8000, category: "paid" },
    ],
    niches: ["Beauty", "Fitness"],
    location: "London, GBP",
    currency: "GBP",
    lastActivity: "Today",
  },
  {
    id: "marcus",
    name: "Marcus Oyelaran",
    email: "marcus@oyelaran.co",
    status: "active",
    agencyId: AGENCY_ID,
    platforms: [
      { id: "yt", platform: "YouTube", followers: 98000, category: "paid" },
      { id: "ig", platform: "Instagram", followers: 23000, category: "organic" },
    ],
    niches: ["Food", "Lifestyle"],
    location: "Lagos, GBP",
    currency: "GBP",
    lastActivity: "Yesterday",
  },
  {
    id: "tom",
    name: "Tom Iwu",
    email: "tom@iwu.studio",
    status: "active",
    agencyId: AGENCY_ID,
    platforms: [
      { id: "yt", platform: "YouTube", followers: 89000, category: "paid" },
    ],
    niches: ["Beauty"],
    location: "London, USD",
    currency: "USD",
    lastActivity: "2 days ago",
  },
  {
    id: "sofia",
    name: "Sofia Lindqvist",
    email: "sofia@lindqvist.com",
    status: "invited",
    agencyId: AGENCY_ID,
    platforms: [
      { id: "tt", platform: "TikTok", followers: 210000, category: "idea" },
    ],
    niches: ["Fashion"],
    location: "Stockholm, EUR",
    currency: "EUR",
    lastActivity: "Invite sent 4 Sep",
  },
  {
    id: "ava",
    name: "Ava Brennan",
    email: null,
    status: "record",
    agencyId: AGENCY_ID,
    platforms: [
      { id: "ig", platform: "Instagram", followers: 34000, category: "organic" },
    ],
    niches: ["Lifestyle"],
    location: "Dublin, EUR",
    currency: "EUR",
    lastActivity: "Added 1 Sep",
  },
];

export const CONTENT: TrackerDetail[] = [
  // —— Fatima (self-serve talent) ——
  {
    id: "1",
    creatorId: "fatima",
    title: "CeraVe Serum Reel",
    platform: "Instagram",
    niche: "Beauty",
    type: "paid_collab",
    brandName: "CeraVe",
    stage: "filmed",
    goLiveDate: "2026-09-26",
    shotList:
      "Close-up serum dropper · bathroom vanity wipe · apply on cheek · product hero",
    notes: "Brand wants SPF mention in caption. Usage rights 6 months.",
    deal: {
      feeAgreed: 1800,
      paymentTerms: "net_30",
      dateDelivered: null,
      dateInvoiced: null,
      datePaid: null,
      deliverables: [
        { id: "d1", type: "video", quantity: 1, rate: 1500 },
        { id: "d2", type: "stories", quantity: 2, rate: 150 },
      ],
    },
    expenses: [
      {
        id: "e1",
        category: "props",
        amount: 42,
        note: "Bathroom styling",
        date: "2026-09-10",
      },
    ],
    ideaTitle: "Morning skincare but make it SPF",
    updatedAt: "2026-09-16",
  },
  {
    id: "2",
    creatorId: "fatima",
    title: "Spring Haul Reel",
    platform: "Instagram",
    niche: "Fashion",
    type: "organic",
    brandName: null,
    stage: "delivered",
    goLiveDate: "2026-09-30",
    shotList: "Haul flat lay · try-on montage · favorites close-ups",
    notes: "Keep cuts snappy — under 45s. Soft spring palette.",
    deal: null,
    expenses: [
      {
        id: "e2",
        category: "editor",
        amount: 75,
        note: "Color grade pass",
        date: "2026-09-18",
      },
    ],
    ideaTitle: null,
    updatedAt: "2026-09-15",
  },
  {
    id: "3",
    creatorId: "fatima",
    title: "Bloom Athletic series",
    platform: "TikTok",
    niche: "Fitness",
    type: "paid_collab",
    brandName: "Bloom Athletic",
    stage: "delivered",
    goLiveDate: "2026-09-20",
    shotList: "Gym floor warmup · three exercise demos · product pack shot",
    notes: "Series drop — post as three-part TikTok.",
    deal: {
      feeAgreed: 1800,
      paymentTerms: "net_30",
      dateDelivered: "2026-09-10",
      dateInvoiced: null,
      datePaid: null,
      deliverables: [{ id: "d3", type: "video", quantity: 3, rate: 600 }],
    },
    expenses: [],
    ideaTitle: null,
    updatedAt: "2026-09-12",
  },
  {
    id: "4",
    creatorId: "fatima",
    title: "Lumen earbuds unboxing",
    platform: "YouTube",
    niche: "Technology",
    type: "paid_collab",
    brandName: "Lumen",
    stage: "go_live",
    goLiveDate: "2026-08-10",
    shotList: "Box open · fit check · sound test B-roll",
    notes: "Affiliate link in description.",
    deal: {
      feeAgreed: 900,
      paymentTerms: "net_30",
      dateDelivered: "2026-08-05",
      dateInvoiced: "2026-08-08",
      datePaid: "2026-08-20",
      deliverables: [
        { id: "d4", type: "video", quantity: 1, rate: 700 },
        { id: "d5", type: "stories", quantity: 2, rate: 100 },
      ],
    },
    expenses: [],
    ideaTitle: null,
    updatedAt: "2026-08-20",
  },
  {
    id: "5",
    creatorId: "fatima",
    title: "GlowSkin SPF morning routine",
    platform: "Instagram",
    niche: "Beauty",
    type: "paid_collab",
    brandName: "GlowSkin",
    stage: "go_live",
    goLiveDate: "2026-07-20",
    shotList: "Sink mirror routine · SPF apply · outdoor light check",
    notes: "Overdue follow-up sent once.",
    deal: {
      feeAgreed: 2500,
      paymentTerms: "net_30",
      dateDelivered: "2026-07-14",
      dateInvoiced: "2026-07-18",
      datePaid: null,
      deliverables: [
        { id: "d6", type: "video", quantity: 3, rate: 700 },
        { id: "d7", type: "stories", quantity: 2, rate: 200 },
      ],
    },
    expenses: [
      {
        id: "e3",
        category: "props",
        amount: 125,
        note: "Mirror lighting kit",
        date: "2026-07-10",
      },
      {
        id: "e4",
        category: "editor",
        amount: 100,
        note: "Cutdowns",
        date: "2026-07-12",
      },
    ],
    ideaTitle: null,
    updatedAt: "2026-08-01",
  },
  {
    id: "6",
    creatorId: "fatima",
    title: "Nord Soft Mist reel",
    platform: "Instagram",
    niche: "Lifestyle",
    type: "paid_collab",
    brandName: "Nord",
    stage: "delivered",
    goLiveDate: "2026-09-22",
    shotList: "Morning desk setup · mist spray · product hero",
    notes: "Invoice sent — due this week.",
    deal: {
      feeAgreed: 1200,
      paymentTerms: "net_30",
      dateDelivered: "2026-08-20",
      dateInvoiced: "2026-08-25",
      datePaid: null,
      deliverables: [{ id: "d8", type: "video", quantity: 1, rate: 1200 }],
    },
    expenses: [],
    ideaTitle: null,
    updatedAt: "2026-09-10",
  },

  // —— Dani (Bright Talent) ——
  {
    id: "dani-glow",
    creatorId: "dani",
    title: "Glow Labs spring serum reel",
    platform: "Instagram",
    niche: "Beauty",
    type: "paid_collab",
    brandName: "Glow Labs",
    stage: "delivered",
    goLiveDate: "2026-07-20",
    shotList: "Vanity serum apply · outdoor glow walk · product hero",
    notes: "Agency follow-up on overdue invoice.",
    deal: {
      feeAgreed: 1500,
      paymentTerms: "net_30",
      dateDelivered: "2026-07-14",
      dateInvoiced: "2026-07-18",
      datePaid: null,
      deliverables: [{ id: "dg1", type: "video", quantity: 1, rate: 1500 }],
    },
    expenses: [],
    ideaTitle: null,
    updatedAt: "2026-07-18",
  },
  {
    id: "dani-bloom",
    creatorId: "dani",
    title: "Bloom Athletic 3-part series",
    platform: "TikTok",
    niche: "Fitness",
    type: "paid_collab",
    brandName: "Bloom Athletic",
    stage: "delivered",
    goLiveDate: "2026-08-10",
    shotList: "Warmup · strength circuit · cooldown pack shot",
    notes: "Waiting on invoice from agency.",
    deal: {
      feeAgreed: 2400,
      paymentTerms: "net_30",
      dateDelivered: "2026-08-02",
      dateInvoiced: null,
      datePaid: null,
      deliverables: [{ id: "db1", type: "video", quantity: 3, rate: 800 }],
    },
    expenses: [],
    ideaTitle: null,
    updatedAt: "2026-08-02",
  },
  {
    id: "dani-autumn",
    creatorId: "dani",
    title: "Autumn capsule haul",
    platform: "Instagram",
    niche: "Fashion",
    type: "organic",
    brandName: null,
    stage: "concept",
    goLiveDate: null,
    shotList: "",
    notes: "Concept only — no brand deal yet.",
    deal: null,
    expenses: [],
    ideaTitle: null,
    updatedAt: "2026-09-01",
  },

  // —— Marcus ——
  {
    id: "marcus-nord",
    creatorId: "marcus",
    title: "Nord coffee brand film",
    platform: "YouTube",
    niche: "Lifestyle",
    type: "paid_collab",
    brandName: "Nord Coffee",
    stage: "delivered",
    goLiveDate: "2026-08-25",
    shotList: "Brew ritual · cafe walk · pour close-up",
    notes: "Awaiting payment.",
    deal: {
      feeAgreed: 3200,
      paymentTerms: "net_30",
      dateDelivered: "2026-08-12",
      dateInvoiced: "2026-08-20",
      datePaid: null,
      deliverables: [{ id: "mn1", type: "video", quantity: 1, rate: 3200 }],
    },
    expenses: [],
    ideaTitle: null,
    updatedAt: "2026-08-20",
  },
  {
    id: "marcus-lumen",
    creatorId: "marcus",
    title: "Lumen earbuds unboxing",
    platform: "YouTube",
    niche: "Technology",
    type: "paid_collab",
    brandName: "Lumen Audio",
    stage: "go_live",
    goLiveDate: "2026-06-12",
    shotList: "Box open · fit check · sound test",
    notes: "Paid and closed.",
    deal: {
      feeAgreed: 900,
      paymentTerms: "net_30",
      dateDelivered: "2026-06-05",
      dateInvoiced: "2026-06-08",
      datePaid: "2026-09-05",
      deliverables: [{ id: "ml1", type: "video", quantity: 1, rate: 900 }],
    },
    expenses: [],
    ideaTitle: null,
    updatedAt: "2026-09-05",
  },

  // —— Tom ——
  {
    id: "tom-harbor",
    creatorId: "tom",
    title: "Harbor gin summer cutdowns",
    platform: "TikTok",
    niche: "Beauty",
    type: "paid_collab",
    brandName: "Harbor",
    stage: "delivered",
    goLiveDate: "2026-08-05",
    shotList: "Pour shot · patio toast · bottle hero",
    notes: "Net 60 terms.",
    deal: {
      feeAgreed: 2400,
      paymentTerms: "net_60",
      dateDelivered: "2026-07-28",
      dateInvoiced: "2026-08-02",
      datePaid: null,
      deliverables: [
        { id: "th1", type: "video", quantity: 3, rate: 600 },
        { id: "th2", type: "stories", quantity: 2, rate: 300 },
      ],
    },
    expenses: [],
    ideaTitle: null,
    updatedAt: "2026-08-02",
  },
];

export const IDEAS_SEED: IdeaItem[] = [
  {
    id: "1",
    creatorId: "fatima",
    title: "Behind the Scenes: A Day in My Life",
    body: "Show a realistic day behind the scenes as a full-time creator.",
    tags: ["lifestyle", "video", "tech"],
    status: "in_progress",
    createdAt: "2026-09-16",
    linkedContentItemId: null,
  },
  {
    id: "2",
    creatorId: "fatima",
    title: "Hotel room workout series",
    body: "3-part series for travel niche. No equipment. Could pitch as a follow-up.",
    tags: ["fitness", "travel"],
    status: "idea",
    createdAt: "2026-09-12",
    linkedContentItemId: null,
  },
  {
    id: "3",
    creatorId: "fatima",
    title: "Morning skincare but make it SPF",
    body: "Angle: most people skip SPF indoors. Partner with a sunscreen brand?",
    tags: ["beauty"],
    status: "used",
    createdAt: "2026-08-28",
    linkedContentItemId: "1",
  },
];

/** Optional activity feed rows keyed by creator id. */
export const ACTIVITY: Record<string, TalentActivityItem[]> = {
  dani: [
    {
      id: "1",
      title: "Invoice date set to 18 Jul",
      meta: "Priya Raman · 18 Jul, 09:41",
    },
    {
      id: "2",
      title: "Terms changed to Net 30",
      meta: "Priya Raman · 18 Jul, 09:40",
    },
    {
      id: "3",
      title: "Marked delivered",
      meta: "Dani Nicholls · 14 Jul, 18:02",
    },
  ],
};

// ---------- scoped accessors ----------

function selfContent(): TrackerDetail[] {
  return getMockContent().filter((item) => item.creatorId === SELF_CREATOR_ID);
}

function agencyCreators(): Creator[] {
  return getMockCreators().filter(
    (c) => c.agencyId === AGENCY_ID,
  ) as Creator[];
}

function dealInPnlRange(
  item: TrackerDetail,
  start: Date | null,
  end: Date | null,
): boolean {
  if (!start && !end) return true;
  const deal = item.deal;
  return (
    dateInPnlRange(item.updatedAt, start, end) ||
    (!!deal?.datePaid && dateInPnlRange(deal.datePaid, start, end)) ||
    (!!deal?.dateInvoiced && dateInPnlRange(deal.dateInvoiced, start, end)) ||
    (!!deal?.dateDelivered && dateInPnlRange(deal.dateDelivered, start, end)) ||
    item.expenses.some((e) => dateInPnlRange(e.date, start, end))
  );
}

function agencyContent(): TrackerDetail[] {
  const ids = new Set(agencyCreators().map((c) => c.id));
  return getMockContent().filter((item) => ids.has(item.creatorId));
}

function contentForCreator(creatorId: string): TrackerDetail[] {
  return getMockContent().filter((item) => item.creatorId === creatorId);
}

function toListItem(detail: TrackerDetail): TrackerItem {
  return {
    id: detail.id,
    title: detail.title,
    platform: detail.platform,
    niche: detail.niche,
    type: detail.type,
    brandName: detail.brandName,
    stage: detail.stage,
    goLiveDate: detail.goLiveDate,
  };
}

function unpaidDeals(items: TrackerDetail[], today = new Date()) {
  return items.filter(
    (item) =>
      item.deal &&
      !item.deal.datePaid &&
      item.type === "paid_collab",
  );
}

function outstandingAmount(items: TrackerDetail[]): number {
  return unpaidDeals(items).reduce(
    (sum, item) => sum + (item.deal?.feeAgreed ?? 0),
    0,
  );
}

function liveDealCount(items: TrackerDetail[]): number {
  return unpaidDeals(items).length;
}

function statusLabel(status: TalentStatus): string {
  if (status === "active") return "Active";
  if (status === "invited") return "Invited";
  return "Record only";
}

// ---------- talent (/home) selectors ----------

export function getTrackerItems(): TrackerItem[] {
  return selfContent().map(toListItem);
}

export function getTrackerDetail(id: string): TrackerDetail | undefined {
  return getMockContent().find((item) => item.id === id);
}

export function getIdeas(): IdeaItem[] {
  return getMockIdeas().filter((idea) => idea.creatorId === SELF_CREATOR_ID);
}

function talentPaymentAction(status: PaymentStatus): TalentPaymentAction {
  if (status === "paid") return "done";
  if (status === "notInvoiced") return "markInvoiced";
  if (status === "awaiting" || status === "overdue") return "markPaid";
  return "none";
}

export function getTalentPayments(today = new Date()): TalentPaymentItem[] {
  return selfContent()
    .filter((item) => item.type === "paid_collab" && item.deal)
    .map((item) => {
      const deal = item.deal!;
      const dealStatus = computeDealStatus(deal, today);
      const status = dealStatusToPayment(dealStatus);
      const dueIso = computeDueDate(deal);
      return {
        id: item.id,
        contentId: item.id,
        content: item.title,
        platform: item.platform,
        brand: item.brandName ?? "—",
        fee: fmtMoney(deal.feeAgreed),
        deliverables: formatDeliverables(deal.deliverables),
        terms: deal.paymentTerms,
        termsLabel: TERM_LABELS[deal.paymentTerms],
        delivered: displayDate(deal.dateDelivered),
        invoiced: displayDate(deal.dateInvoiced),
        due: displayDate(dueIso),
        status,
        statusLabel: DEAL_STATUS_LABELS[dealStatus],
        paid: displayDate(deal.datePaid),
        action: talentPaymentAction(status),
      };
    });
}

export function getTalentPnlRows(
  filter?: PnlDateFilter,
  today = filter?.today ?? new Date(),
): TalentPnlContentRow[] {
  const { start, end } = resolvePnlBounds(
    filter ? { ...filter, today } : undefined,
  );

  return selfContent()
    .filter((item) => item.deal || item.expenses.length > 0)
    .map((item) => {
      const expenses = item.expenses
        .filter((e) => dateInPnlRange(e.date, start, end))
        .reduce((sum, e) => sum + e.amount, 0);
      const fee = item.deal?.feeAgreed ?? null;
      const dealStatus = item.deal
        ? computeDealStatus(item.deal, today)
        : null;
      const active =
        (!start && !end) ||
        dateInPnlRange(item.updatedAt, start, end) ||
        (!!item.deal?.datePaid &&
          dateInPnlRange(item.deal.datePaid, start, end)) ||
        item.expenses.some((e) => dateInPnlRange(e.date, start, end));
      return {
        id: item.id,
        contentId: item.id,
        title: item.title,
        type: item.type,
        brand: item.brandName,
        niche: item.niche,
        paymentStatus: dealStatus ? dealStatusToPayment(dealStatus) : null,
        paymentLabel: dealStatus ? DEAL_STATUS_LABELS[dealStatus] : null,
        fee,
        expenses,
        profit: (fee ?? 0) - expenses,
        active,
      };
    })
    .filter((row) => row.active)
    .map(({ active: _active, ...row }) => {
      void _active;
      return row;
    });
}

function breakdownBy(
  rows: TalentPnlContentRow[],
  key: (row: TalentPnlContentRow) => string | null,
): TalentPnlBreakdownRow[] {
  const map = new Map<string, { fee: number; expenses: number }>();
  for (const row of rows) {
    const name = key(row);
    if (!name) continue;
    const cur = map.get(name) ?? { fee: 0, expenses: 0 };
    cur.fee += row.fee ?? 0;
    cur.expenses += row.expenses;
    map.set(name, cur);
  }
  return [...map.entries()]
    .map(([name, value]) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      fee: value.fee,
      expenses: value.expenses,
      profit: value.fee - value.expenses,
    }))
    .sort((a, b) => b.profit - a.profit);
}

export function getTalentPnlByBrand(
  filter?: PnlDateFilter,
  today = filter?.today ?? new Date(),
): TalentPnlBreakdownRow[] {
  return breakdownBy(getTalentPnlRows(filter, today), (row) => row.brand);
}

export function getTalentPnlByNiche(
  filter?: PnlDateFilter,
  today = filter?.today ?? new Date(),
): TalentPnlBreakdownRow[] {
  return breakdownBy(getTalentPnlRows(filter, today), (row) => row.niche);
}

export function getTalentPnlSummary(
  filter?: PnlDateFilter,
  today = filter?.today ?? new Date(),
): TalentPnlSummary {
  const { start, end } = resolvePnlBounds(
    filter ? { ...filter, today } : undefined,
  );
  const items = selfContent();
  const revenue = items.reduce((sum, item) => {
    if (!item.deal?.datePaid) return sum;
    if (!dateInPnlRange(item.deal.datePaid, start, end)) return sum;
    return sum + item.deal.feeAgreed;
  }, 0);
  const expenses = items.reduce(
    (sum, item) =>
      sum +
      item.expenses
        .filter((e) => dateInPnlRange(e.date, start, end))
        .reduce((s, e) => s + e.amount, 0),
    0,
  );
  const overdue = items.filter(
    (item) => item.deal && computeDealStatus(item.deal, today) === "overdue",
  ).length;
  return { revenue, expenses, net: revenue - expenses, overdue };
}

export function getOverviewStats(today = new Date()): OverviewStats {
  const items = selfContent();
  const inProgress = items.filter((item) => item.stage !== "go_live").length;
  const deals = items.filter((item) => item.deal).map((item) => item.deal!);
  const paymentsDue = deals.filter((d) => d.dateInvoiced && !d.datePaid).length;
  const revenue = deals
    .filter((d) => d.datePaid)
    .reduce((sum, d) => sum + d.feeAgreed, 0);

  const todayIso = today.toISOString().slice(0, 10);
  const todayDate = new Date(`${todayIso}T12:00:00`);
  const weekAhead = new Date(todayDate);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const dueThisWeek = deals
    .filter((d) => {
      if (d.datePaid) return false;
      const due = computeDueDate(d);
      if (!due) return false;
      const dueDate = new Date(`${due}T12:00:00`);
      return dueDate >= todayDate && dueDate <= weekAhead;
    })
    .reduce((sum, d) => sum + d.feeAgreed, 0);

  return {
    inProgress,
    paymentsDue,
    revenue: fmtMoney(revenue),
    dueThisWeek: fmtMoney(dueThisWeek),
  };
}

export function getContinueFeed(limit = 4): ContinueFeedItem[] {
  const contentFeed = selfContent().map((item) => ({
    kind: "content" as const,
    date: item.updatedAt,
    id: item.id,
    title: item.title,
    category: contentCategory(item.type),
    pill: contentPillLabel(item.type),
    meta: `${item.platform} · ${STAGE_LABELS[item.stage]}`,
    href: `/home/tracker/${item.id}`,
  }));

  const ideaFeed = getIdeas()
    .filter((idea) => idea.status !== "used")
    .map((idea) => ({
      kind: "idea" as const,
      date: idea.createdAt,
      id: `idea-${idea.id}`,
      title: idea.title,
      category: "idea" as const,
      pill: "Idea",
      meta: idea.tags.length
        ? `Brain dump · ${idea.tags.join(", ")}`
        : "Brain dump",
      href: "/home/ideas",
    }));

  return [...contentFeed, ...ideaFeed]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map(({ kind, date, ...item }) => {
      void kind;
      void date;
      return item;
    });
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function fmtMemberSince(iso?: string): string {
  const raw = iso?.slice(0, 10) ?? "2026-09-01";
  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Member since";
  return `Member since ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function getSelfProfile(): TalentProfileData {
  const self = creatorById(SELF_CREATOR_ID)!;
  return {
    name: self.name,
    email: self.email,
    ageBracket: self.ageBracket ?? "25_34",
    memberSince: fmtMemberSince(self.joinedAt),
    communityLabel: `${fmtCommunity(totalFollowers(self.platforms))} community`,
    niches: self.platforms.map((p) => p.platform).join(", ") || "no platforms yet",
    platforms: self.platforms,
  };
}

/** Platform names for content forms — profile platforms, else Instagram/TikTok/YouTube. */
export function getSelfContentPlatforms(): string[] {
  const self = creatorById(SELF_CREATOR_ID);
  const fromProfile =
    self?.platforms.map((p) => p.platform.trim()).filter(Boolean) ?? [];
  return fromProfile.length > 0 ? fromProfile : [...ONBOARDING_PLATFORMS];
}

export function getSelfContentPlatformOptions(extra?: string | null): {
  value: string;
  label: string;
}[] {
  const platforms = getSelfContentPlatforms();
  const list =
    extra && !platforms.includes(extra) ? [...platforms, extra] : platforms;
  return list.map((platform) => ({ value: platform, label: platform }));
}

// ---------- agency (/workspace) selectors ----------

function toTalentItem(creator: Creator): TalentItem {
  const items = contentForCreator(creator.id);
  const outstanding = outstandingAmount(items);
  const live = liveDealCount(items);
  const hasDeals = items.some((i) => i.type === "paid_collab" && i.deal);

  return {
    id: creator.id,
    name: creator.name,
    email: creator.email,
    status: creator.status,
    statusLabel: statusLabel(creator.status),
    platforms: platformsShort(creator.platforms),
    platformsFull: platformsFull(creator.platforms),
    community: fmtCommunity(totalFollowers(creator.platforms)),
    niches: creator.niches.join(", "),
    location: creator.location,
    liveDeals: hasDeals || live > 0 ? String(live) : null,
    outstanding:
      outstanding > 0 ? fmtCurrency(outstanding, creator.currency) : null,
    lastActivity: creator.lastActivity,
  };
}

export function getAgencyTalent(): TalentItem[] {
  return agencyCreators().map(toTalentItem);
}

function toTalentDeal(
  item: TrackerDetail,
  today = new Date(),
): TalentDeal {
  const dealStatus = item.deal ? computeDealStatus(item.deal, today) : null;
  const payment = dealStatus ? toDealPayment(dealStatus) : null;
  return {
    id: item.id,
    content: item.title,
    brand: item.brandName,
    platform: item.platform,
    fee: item.deal
      ? fmtCurrency(
          item.deal.feeAgreed,
          creatorById(item.creatorId)?.currency ?? "USD",
        )
      : null,
    stage: STAGE_LABELS[item.stage as Stage] ?? item.stage,
    payment,
    paymentLabel: payment
      ? payment === "overdue"
        ? "Overdue"
        : "Awaiting payment"
      : null,
  };
}

function toInvoicing(
  item: TrackerDetail,
  creator: Creator,
  today = new Date(),
): TalentInvoicing | null {
  if (!item.deal) return null;
  const due = computeDueDate(item.deal);
  const fee = fmtCurrency(item.deal.feeAgreed, creator.currency);
  const delivered = item.deal.dateDelivered
    ? formatLiveDate(item.deal.dateDelivered)
    : "—";
  return {
    dealTitle: item.title,
    summary: `${fee} · delivered ${delivered}`,
    dateInvoiced: item.deal.dateInvoiced ?? "",
    paymentTerms: TERM_LABELS[item.deal.paymentTerms],
    datePaid: item.deal.datePaid ? formatLiveDate(item.deal.datePaid) : "Not yet",
    datePaidHint: `${creator.name.split(" ")[0]} confirms this`,
    dueNote: due
      ? `Due ${formatLiveDate(due)}${
          computeDealStatus(item.deal, today) === "overdue"
            ? ` · ${daysBetween(due, today)} days overdue`
            : ""
        }`
      : "Not invoiced",
  };
}

export function getTalentById(
  id: string,
  today = new Date(),
): TalentDetail | null {
  const creator = agencyCreators().find((c) => c.id === id);
  if (!creator) return null;
  const base = toTalentItem(creator);
  const items = contentForCreator(id);
  const deals = items.map((item) => toTalentDeal(item, today));
  const invoiceSource =
    items.find(
      (item) =>
        item.deal &&
        computeDealStatus(item.deal, today) === "overdue",
    ) ??
    items.find(
      (item) =>
        item.deal &&
        !item.deal.datePaid &&
        item.deal.dateInvoiced,
    ) ??
    null;

  return {
    ...base,
    firstName: creator.name.split(" ")[0] ?? creator.name,
    deals,
    invoicing: invoiceSource
      ? toInvoicing(invoiceSource, creator, today)
      : null,
    activity: ACTIVITY[id] ?? [],
  };
}

export function getAgencyPayments(today = new Date()): PaymentItem[] {
  return agencyContent()
    .filter((item) => item.type === "paid_collab" && item.deal)
    .map((item) => {
      const creator = creatorById(item.creatorId)!;
      const deal = item.deal!;
      const dealStatus = computeDealStatus(deal, today);
      const status = dealStatusToPayment(dealStatus);
      const dueIso = computeDueDate(deal);
      return {
        id: item.id,
        talentName: creator.name.split(" ")[0] ?? creator.name,
        content: item.title,
        brand: item.brandName ?? "—",
        platform: item.platform,
        fee: fmtCurrency(deal.feeAgreed, creator.currency),
        terms: TERM_LABELS[deal.paymentTerms],
        paymentTerms: deal.paymentTerms,
        dateInvoicedIso: deal.dateInvoiced,
        delivered: displayShortDate(deal.dateDelivered),
        invoiced: displayShortDate(deal.dateInvoiced),
        due: displayShortDate(dueIso),
        status,
        statusLabel: DEAL_STATUS_LABELS[dealStatus],
        paid: displayShortDate(deal.datePaid),
        action: status === "notInvoiced" ? "setInvoice" : "edit",
      };
    });
}

export function getAgencyPnlTalent(
  filter?: PnlDateFilter,
  today = filter?.today ?? new Date(),
): PnlTalentRow[] {
  const { start, end } = resolvePnlBounds(
    filter ? { ...filter, today } : undefined,
  );
  const rows: PnlTalentRow[] = [];
  for (const creator of agencyCreators()) {
    if (creator.status !== "active") continue;
    const items = contentForCreator(creator.id).filter(
      (i) =>
        i.deal &&
        i.type === "paid_collab" &&
        dealInPnlRange(i, start, end),
    );
    const billed = items.reduce((s, i) => s + (i.deal?.feeAgreed ?? 0), 0);
    if (billed === 0) continue;
    const received = items
      .filter(
        (i) =>
          i.deal?.datePaid && dateInPnlRange(i.deal.datePaid, start, end),
      )
      .reduce((s, i) => s + (i.deal?.feeAgreed ?? 0), 0);
    const outstanding = billed - received;
    const overdue = items
      .filter(
        (i) => i.deal && computeDealStatus(i.deal, today) === "overdue",
      )
      .reduce((s, i) => s + (i.deal?.feeAgreed ?? 0), 0);
    rows.push({
      id: creator.id,
      name: creator.name,
      currency: creator.currency,
      billed: fmtCurrency(billed, creator.currency),
      received: fmtCurrency(received, creator.currency),
      outstanding: fmtCurrency(outstanding, creator.currency),
      overdue: overdue > 0 ? fmtCurrency(overdue, creator.currency) : null,
    });
  }
  return rows;
}

export function getAgencyPnlBrands(filter?: PnlDateFilter): PnlBrandRow[] {
  const { start, end } = resolvePnlBounds(filter);
  const map = new Map<string, { name: string; amount: number; currency: CurrencyCode }>();
  for (const item of agencyContent()) {
    if (!item.deal || !item.brandName) continue;
    if (!dealInPnlRange(item, start, end)) continue;
    const creator = creatorById(item.creatorId)!;
    const key = item.brandName.toLowerCase();
    const cur = map.get(key) ?? {
      name: item.brandName,
      amount: 0,
      currency: creator.currency,
    };
    cur.amount += item.deal.feeAgreed;
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([id, value]) => ({
      id,
      name: value.name,
      amount: value.amount,
      currency: value.currency,
    }))
    .sort((a, b) => b.amount - a.amount)
    .map(({ id, name, amount, currency }) => ({
      id,
      name,
      value: fmtCurrency(amount, currency),
    }));
}

export function getAgencyPnlCurrencies(
  filter?: PnlDateFilter,
  today = filter?.today ?? new Date(),
): PnlCurrencySummary[] {
  const { start, end } = resolvePnlBounds(
    filter ? { ...filter, today } : undefined,
  );
  const byCurrency = new Map<
    CurrencyCode,
    { talentIds: Set<string>; billed: number; received: number; overdue: number }
  >();

  for (const creator of agencyCreators()) {
    const items = contentForCreator(creator.id).filter(
      (i) =>
        i.deal &&
        i.type === "paid_collab" &&
        dealInPnlRange(i, start, end),
    );
    if (items.length === 0) continue;
    const bucket = byCurrency.get(creator.currency) ?? {
      talentIds: new Set<string>(),
      billed: 0,
      received: 0,
      overdue: 0,
    };
    bucket.talentIds.add(creator.id);
    for (const item of items) {
      const fee = item.deal!.feeAgreed;
      bucket.billed += fee;
      if (
        item.deal!.datePaid &&
        dateInPnlRange(item.deal!.datePaid, start, end)
      ) {
        bucket.received += fee;
      }
      if (computeDealStatus(item.deal!, today) === "overdue") {
        bucket.overdue += fee;
      }
    }
    byCurrency.set(creator.currency, bucket);
  }

  const order: CurrencyCode[] = ["GBP", "USD", "EUR"];
  const names: Record<CurrencyCode, string> = {
    GBP: "Pound sterling",
    USD: "US dollar",
    EUR: "Euro",
  };

  return order
    .filter((code) => byCurrency.has(code))
    .map((code) => {
      const bucket = byCurrency.get(code)!;
      const outstanding = bucket.billed - bucket.received;
      return {
        id: code.toLowerCase(),
        name: names[code],
        talentCount: bucket.talentIds.size,
        metrics: [
          {
            label: "Billed",
            value: fmtCurrency(bucket.billed, code),
            tone: "idea" as const,
          },
          {
            label: "Received",
            value: fmtCurrency(bucket.received, code),
            tone: "collab" as const,
          },
          {
            label: "Outstanding",
            value: fmtCurrency(outstanding, code),
            tone: "payment" as const,
          },
          {
            label: "Overdue",
            value:
              bucket.overdue > 0
                ? fmtCurrency(bucket.overdue, code)
                : "—",
            tone:
              bucket.overdue > 0
                ? ("organic" as const)
                : ("background" as const),
            emphasize: bucket.overdue > 0,
          },
        ],
      };
    });
}

export function getAgencyAttention(today = new Date()): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const item of agencyContent()) {
    if (!item.deal || item.type !== "paid_collab") continue;
    const creator = creatorById(item.creatorId)!;
    const status = computeDealStatus(item.deal, today);
    const fee = fmtCurrency(item.deal.feeAgreed, creator.currency);
    const due = computeDueDate(item.deal);

    if (status === "overdue" && due) {
      items.push({
        name: creator.name,
        project: item.title,
        detail: `${daysBetween(due, today)} days overdue`,
        amount: fee,
        overdue: true,
      });
    } else if (status === "awaiting_payment" && due) {
      const days = -daysBetween(due, today);
      items.push({
        name: creator.name,
        project: item.title,
        detail: days >= 0 ? `Due in ${days} days` : `Due ${displayShortDate(due)}`,
        amount: fee,
        overdue: false,
      });
    } else if (status === "not_invoiced" && item.deal.dateDelivered) {
      items.push({
        name: creator.name,
        project: item.title,
        detail: `Delivered ${displayShortDate(item.deal.dateDelivered)} · Not invoiced`,
        amount: fee,
        overdue: false,
      });
    }
  }

  return items.sort((a, b) => Number(b.overdue) - Number(a.overdue));
}

export function getAgencyRoster(): RosterItem[] {
  return agencyCreators().map((creator) => {
    const items = contentForCreator(creator.id);
    const outstanding = outstandingAmount(items);
    const notInvoiced = items.filter(
      (i) =>
        i.deal &&
        !i.deal.dateInvoiced &&
        !i.deal.datePaid &&
        i.type === "paid_collab",
    );
    let meta = creator.lastActivity;
    if (creator.status === "record") meta = "Not on Creator Assist";
    else if (creator.status === "invited") meta = creator.lastActivity;
    else if (outstanding > 0)
      meta = `${fmtCurrency(outstanding, creator.currency)} outstanding`;
    else if (notInvoiced.length > 0) {
      const sum = notInvoiced.reduce((s, i) => s + (i.deal?.feeAgreed ?? 0), 0);
      meta = `${fmtCurrency(sum, creator.currency)} to invoice`;
    }

    return {
      name: creator.name,
      platforms: platformsFull(creator.platforms).replace(/, /g, " · "),
      status: statusLabel(creator.status),
      statusTone:
        creator.status === "active"
          ? "active"
          : creator.status === "invited"
            ? "invited"
            : "record",
      meta,
    };
  });
}

export function getAgencyOverviewStats(
  today = new Date(),
): AgencyOverviewStats {
  const roster = agencyCreators();
  const active = roster.filter((c) => c.status === "active").length;
  const invited = roster.filter((c) => c.status === "invited").length;
  const record = roster.filter((c) => c.status === "record").length;
  const liveDeals = unpaidDeals(agencyContent(), today).length;

  const byCurrency = new Map<CurrencyCode, { outstanding: number; overdue: number; received: number }>();
  for (const creator of roster) {
    const items = contentForCreator(creator.id);
    const bucket = byCurrency.get(creator.currency) ?? {
      outstanding: 0,
      overdue: 0,
      received: 0,
    };
    for (const item of items) {
      if (!item.deal || item.type !== "paid_collab") continue;
      if (item.deal.datePaid) {
        // only count "this month" roughly — paid in Sep 2026 for demo; Marcus lumen paid Jun so not this month
        const paidMonth = item.deal.datePaid.slice(0, 7);
        const thisMonth = today.toISOString().slice(0, 7);
        if (paidMonth === thisMonth) bucket.received += item.deal.feeAgreed;
      } else {
        bucket.outstanding += item.deal.feeAgreed;
        if (computeDealStatus(item.deal, today) === "overdue") {
          bucket.overdue += item.deal.feeAgreed;
        }
      }
    }
    byCurrency.set(creator.currency, bucket);
  }

  const gbp = byCurrency.get("GBP") ?? { outstanding: 0, overdue: 0, received: 0 };
  const usd = byCurrency.get("USD") ?? { outstanding: 0, overdue: 0, received: 0 };
  const overdueGbp = gbp.overdue;
  const overdueUsd = usd.overdue;
  const overdueItems = getAgencyAttention(today).filter((i) => i.overdue);
  const overduePrimary =
    overdueGbp > 0
      ? fmtCurrency(overdueGbp, "GBP")
      : overdueUsd > 0
        ? fmtCurrency(overdueUsd, "USD")
        : fmtCurrency(0, "GBP");

  return {
    talentCount: roster.length,
    talentFooter: `${active} active · ${invited} invited · ${record} record`,
    outstanding: fmtCurrency(gbp.outstanding, "GBP"),
    outstandingFooter:
      usd.outstanding > 0
        ? `+ ${fmtCurrency(usd.outstanding, "USD")} · two currencies`
        : "GBP roster",
    overdue: overduePrimary,
    overdueFooter:
      overdueItems.length > 0
        ? `${overdueItems.length} deal${overdueItems.length === 1 ? "" : "s"}, ${overdueItems[0]?.detail ?? ""}`
        : "None",
    received: fmtCurrency(gbp.received, "GBP"),
    receivedFooter: "confirmed by talent",
    description: `Bright Talent · ${roster.length} talent · ${liveDeals} live deals`,
  };
}

// ---------- bind mutable session store to seed tables ----------

bindMockSeeds({
  content: CONTENT,
  ideas: IDEAS_SEED,
  creators: CREATORS,
});

/** Live snapshots — prefer calling getters in components via useMockDb. */
export function getTrackerItemsLive() {
  return getTrackerItems();
}
export function getIdeasLive() {
  return getIdeas();
}
export function getTalentPaymentsLive() {
  return getTalentPayments();
}
export function getTalentPnlLive() {
  return {
    summary: getTalentPnlSummary(),
    rows: getTalentPnlRows(),
    byBrand: getTalentPnlByBrand(),
    byNiche: getTalentPnlByNiche(),
  };
}
export function getOverviewLive() {
  return {
    stats: getOverviewStats(),
    feed: getContinueFeed(),
    profile: getSelfProfile(),
  };
}

// Compat aliases (evaluated at call sites that still import constants — prefer getters).
export const TRACKER_ITEMS = getTrackerItems();
export const TRACKER_DETAILS = selfContent();
export const IDEAS = getIdeas();
export const TALENT_PAYMENTS = getTalentPayments();
export const TALENT_PNL_ROWS = getTalentPnlRows();
export const TALENT_PNL_BY_BRAND = getTalentPnlByBrand();
export const TALENT_PNL_BY_NICHE = getTalentPnlByNiche();
export const TALENT_PNL_SUMMARY = getTalentPnlSummary();
export const CONTINUE_ITEMS = getContinueFeed();
export const OVERVIEW_STATS = getOverviewStats();
export const TALENT_PROFILE = getSelfProfile();

export const TALENT = getAgencyTalent();
export const PAYMENTS = getAgencyPayments();
export const PNL_TALENT = getAgencyPnlTalent();
export const PNL_BRANDS = getAgencyPnlBrands();
export const PNL_CURRENCIES = getAgencyPnlCurrencies();
export const AGENCY_ATTENTION = getAgencyAttention();
export const AGENCY_ROSTER = getAgencyRoster();
export const AGENCY_OVERVIEW_STATS = getAgencyOverviewStats();
