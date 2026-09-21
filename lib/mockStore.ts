/**
 * Session-scoped mutable mock DB.
 * Changes persist in sessionStorage until logout (resetMockDb).
 */
import type { AgeBracket } from "@/lib/onboarding";
import type { IdeaItem } from "@/lib/talentMock";
import type { Category } from "@/lib/ui";
import type { ContentType, PaymentTerms, TrackerDetail } from "@/lib/tracker";

const STORAGE_KEY = "ca-mock-db-v2";
const SELF_CREATOR_ID = "fatima";

export type MockCreatorPlatform = {
  id: string;
  platform: string;
  followers: number;
  category: Category;
  handle?: string | null;
};

export type MockCreator = {
  id: string;
  name: string;
  email: string | null;
  status: string;
  agencyId: string | null;
  platforms: MockCreatorPlatform[];
  niches: string[];
  location: string;
  currency: string;
  lastActivity: string;
  ageBracket?: AgeBracket;
};

export type MockDbState = {
  content: TrackerDetail[];
  ideas: IdeaItem[];
  creators: MockCreator[];
};

type SeedBundle = MockDbState;

let seed: SeedBundle | null = null;
let state: MockDbState | null = null;
let revision = 0;
let sessionHydrated = false;
const listeners = new Set<() => void>();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyState(): MockDbState {
  return { content: [], ideas: [], creators: [] };
}

function normalizeState(partial: Partial<MockDbState> | null): MockDbState {
  const base = seed ? clone(seed) : emptyState();
  if (!partial) return base;
  return {
    content: Array.isArray(partial.content) ? partial.content : base.content,
    ideas: Array.isArray(partial.ideas) ? partial.ideas : base.ideas,
    creators: Array.isArray(partial.creators)
      ? partial.creators
      : base.creators,
  };
}

/** Seed only — session restore happens after mount via hydrateMockDbFromSession. */
function ensureState(): MockDbState {
  if (!state) {
    if (!seed) {
      return emptyState();
    }
    state = clone(seed);
  }
  return state;
}

function persist() {
  if (typeof window === "undefined" || !state || !sessionHydrated) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

function emit() {
  revision += 1;
  persist();
  listeners.forEach((listener) => listener());
}

function notify() {
  revision += 1;
  listeners.forEach((listener) => listener());
}

export function getMockRevision(): number {
  ensureState();
  return revision;
}

/**
 * Restore sessionStorage after hydration so SSR + first client paint match seed.
 * Call once from a client useEffect.
 */
export function hydrateMockDbFromSession() {
  if (typeof window === "undefined" || sessionHydrated) return;
  sessionHydrated = true;
  ensureState();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    state = normalizeState(JSON.parse(raw) as Partial<MockDbState>);
    notify();
  } catch {
    /* ignore corrupt session */
  }
}

export function bindMockSeeds(bundle: SeedBundle) {
  if (seed) return;
  seed = {
    content: clone(bundle.content),
    ideas: clone(bundle.ideas),
    creators: clone(bundle.creators),
  };
}

export function subscribeMockDb(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMockDbSnapshot(): MockDbState {
  return ensureState();
}

export function getMockDbServerSnapshot(): MockDbState {
  return seed ? clone(seed) : emptyState();
}

export function getMockContent(): TrackerDetail[] {
  return ensureState().content;
}

export function getMockIdeas(): IdeaItem[] {
  return ensureState().ideas;
}

export function getMockCreators(): MockCreator[] {
  return ensureState().creators;
}

export function resetMockDb() {
  if (!seed) return;
  sessionHydrated = true;
  state = clone(seed);
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  notify();
}

function setState(next: MockDbState) {
  state = next;
  emit();
}

export function upsertContent(item: TrackerDetail) {
  const db = ensureState();
  const index = db.content.findIndex((row) => row.id === item.id);
  const content =
    index >= 0
      ? db.content.map((row, i) => (i === index ? item : row))
      : [item, ...db.content];
  setState({ ...db, content });
}

export function deleteContent(id: string) {
  const db = ensureState();
  setState({
    ...db,
    content: db.content.filter((row) => row.id !== id),
    ideas: db.ideas.map((idea) =>
      idea.linkedContentItemId === id
        ? { ...idea, linkedContentItemId: null, status: "idea" as const }
        : idea,
    ),
  });
}

export function setContentStage(id: string, stage: TrackerDetail["stage"]) {
  const db = ensureState();
  setState({
    ...db,
    content: db.content.map((row) =>
      row.id === id ? { ...row, stage, updatedAt: todayIso() } : row,
    ),
  });
}

export function addContent(payload: {
  title: string;
  platform: string;
  niche: string | null;
  type: ContentType;
  brandName: string | null;
  goLiveDate: string | null;
  notes?: string;
  ideaTitle?: string | null;
  creatorId?: string;
}): TrackerDetail {
  const id = `c-${Date.now()}`;
  const item: TrackerDetail = {
    id,
    creatorId: payload.creatorId ?? SELF_CREATOR_ID,
    title: payload.title,
    platform: payload.platform || "Instagram",
    niche: payload.niche,
    type: payload.type,
    brandName: payload.type === "paid_collab" ? payload.brandName : null,
    stage: "concept",
    goLiveDate: payload.goLiveDate,
    shotList: "",
    notes: payload.notes ?? "",
    deal:
      payload.type === "paid_collab"
        ? {
            feeAgreed: 0,
            paymentTerms: "net_30",
            dateDelivered: null,
            dateInvoiced: null,
            datePaid: null,
            deliverables: [],
          }
        : null,
    expenses: [],
    ideaTitle: payload.ideaTitle ?? null,
    updatedAt: todayIso(),
  };
  upsertContent(item);
  return item;
}

export function upsertIdea(idea: IdeaItem) {
  const db = ensureState();
  const index = db.ideas.findIndex((row) => row.id === idea.id);
  const ideas =
    index >= 0
      ? db.ideas.map((row, i) => (i === index ? idea : row))
      : [idea, ...db.ideas];
  setState({ ...db, ideas });
}

export function deleteIdea(id: string) {
  const db = ensureState();
  setState({
    ...db,
    ideas: db.ideas.filter((row) => row.id !== id),
  });
}

export function addIdea(payload: {
  title: string;
  body: string;
  tags: string[];
  status: IdeaItem["status"];
  creatorId?: string;
}): IdeaItem {
  const idea: IdeaItem = {
    id: `idea-${Date.now()}`,
    creatorId: payload.creatorId ?? SELF_CREATOR_ID,
    title: payload.title,
    body: payload.body,
    tags: payload.tags,
    status: payload.status,
    createdAt: todayIso(),
    linkedContentItemId: null,
  };
  upsertIdea(idea);
  return idea;
}

/** Creates a tracker item from an idea and links them. Returns new content id. */
export function turnIdeaIntoContent(ideaId: string): string | null {
  const db = ensureState();
  const idea = db.ideas.find((row) => row.id === ideaId);
  if (!idea) return null;

  const content = addContent({
    title: idea.title,
    platform: "Instagram",
    niche: idea.tags[0] ?? null,
    type: "organic",
    brandName: null,
    goLiveDate: null,
    notes: idea.body,
    ideaTitle: idea.title,
    creatorId: idea.creatorId,
  });

  upsertIdea({
    ...idea,
    status: "used",
    linkedContentItemId: content.id,
  });

  return content.id;
}

export function markContentPaid(contentId: string) {
  const db = ensureState();
  const paid = todayIso();
  setState({
    ...db,
    content: db.content.map((row) => {
      if (row.id !== contentId || !row.deal) return row;
      return {
        ...row,
        updatedAt: paid,
        deal: {
          ...row.deal,
          datePaid: paid,
          dateInvoiced: row.deal.dateInvoiced ?? paid,
          dateDelivered: row.deal.dateDelivered ?? paid,
        },
      };
    }),
  });
}

export function markContentInvoiced(contentId: string, terms: PaymentTerms) {
  const db = ensureState();
  const invoiced = todayIso();
  setState({
    ...db,
    content: db.content.map((row) => {
      if (row.id !== contentId || !row.deal) return row;
      return {
        ...row,
        updatedAt: invoiced,
        deal: {
          ...row.deal,
          paymentTerms: terms,
          dateInvoiced: invoiced,
          dateDelivered: row.deal.dateDelivered ?? invoiced,
          datePaid: null,
        },
      };
    }),
  });
}

/** Agency payment edit — set invoice date + terms on a deal. */
export function updateContentInvoice(
  contentId: string,
  payload: { dateInvoiced: string; paymentTerms: PaymentTerms },
) {
  hydrateMockDbFromSession();
  const db = ensureState();
  const invoiced = payload.dateInvoiced.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiced)) return;

  setState({
    ...db,
    content: db.content.map((row) => {
      if (row.id !== contentId || !row.deal) return row;
      return {
        ...row,
        updatedAt: todayIso(),
        deal: {
          ...row.deal,
          paymentTerms: payload.paymentTerms,
          dateInvoiced: invoiced,
          dateDelivered: row.deal.dateDelivered ?? invoiced,
        },
      };
    }),
  });
}

function patchSelfCreator(
  patch: (creator: MockCreator) => MockCreator,
): void {
  const db = ensureState();
  const index = db.creators.findIndex((row) => row.id === SELF_CREATOR_ID);
  if (index < 0) return;
  const creators = db.creators.map((row, i) =>
    i === index ? patch(row) : row,
  );
  setState({ ...db, creators });
}

export function updateSelfProfile(patch: {
  name?: string;
  ageBracket?: AgeBracket;
}) {
  patchSelfCreator((creator) => ({
    ...creator,
    name: patch.name?.trim() || creator.name,
    ageBracket: patch.ageBracket ?? creator.ageBracket,
    lastActivity: "Today",
  }));
}

export function updateSelfPlatforms(platforms: MockCreatorPlatform[]) {
  patchSelfCreator((creator) => ({
    ...creator,
    platforms,
    lastActivity: "Today",
  }));
}

export function saveSelfOnboarding(payload: {
  name: string;
  ageBracket: AgeBracket;
  platforms: MockCreatorPlatform[];
}) {
  patchSelfCreator((creator) => ({
    ...creator,
    name: payload.name.trim() || creator.name,
    ageBracket: payload.ageBracket,
    platforms: payload.platforms,
    lastActivity: "Today",
  }));
}

const PLATFORM_CATEGORY: Record<string, Category> = {
  Instagram: "organic",
  TikTok: "idea",
  YouTube: "paid",
};

const PLATFORM_IDS: Record<string, string> = {
  Instagram: "ig",
  TikTok: "tt",
  YouTube: "yt",
};

export function platformCategoryFor(platform: string): Category {
  return PLATFORM_CATEGORY[platform] ?? "organic";
}

export function platformIdFor(platform: string, fallback?: string): string {
  return PLATFORM_IDS[platform] ?? fallback ?? platform.toLowerCase().replace(/\s+/g, "-");
}

const AGENCY_ID = "bright";

export function addAgencyTalent(payload: {
  name: string;
  email?: string | null;
  status: "invited" | "record";
  platform?: string;
  handle?: string | null;
  followers?: number;
  niche?: string | null;
}): MockCreator {
  hydrateMockDbFromSession();
  const db = ensureState();
  const platformName = payload.platform?.trim() || "Instagram";
  const niche = payload.niche?.trim() || "";
  const email = payload.email?.trim() || null;
  const creator: MockCreator = {
    id: `talent-${Date.now()}`,
    name: payload.name.trim(),
    email,
    status: payload.status,
    agencyId: AGENCY_ID,
    platforms: [
      {
        id: platformIdFor(platformName),
        platform: platformName,
        followers: payload.followers ?? 0,
        category: platformCategoryFor(platformName),
        handle: payload.handle?.trim() || "",
      },
    ],
    niches: niche ? [niche] : [],
    location: "Remote, USD",
    currency: "USD",
    lastActivity:
      payload.status === "invited" ? "Invite pending" : "Added today",
  };
  setState({ ...db, creators: [creator, ...db.creators] });
  return creator;
}
