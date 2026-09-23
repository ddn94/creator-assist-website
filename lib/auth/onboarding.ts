export type PlatformAnswer = {
  platform: string;
  handle: string;
  followers: number;
};

/**
 * Onboarding answers live in profiles.onboarding (jsonb).
 * Add a question by writing a new key from the form. Remove a question by
 * stopping writing that key. Old answers can stay in the object.
 *
 * These keys are copied onto profile columns because the rest of the app
 * reads them directly: name, agencyName, country.
 */
export const ONBOARDING_KEYS = {
  name: "name",
  ageBracket: "ageBracket",
  country: "country",
  platforms: "platforms",
  agencyName: "agencyName",
  rosterSize: "rosterSize",
} as const;

export function asAnswers(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function readString(
  answers: Record<string, unknown>,
  key: string,
): string {
  const value = answers[key];
  return typeof value === "string" ? value : "";
}

export function readPlatforms(answers: Record<string, unknown>): PlatformAnswer[] {
  const raw = answers.platforms;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const platform = typeof row.platform === "string" ? row.platform.trim() : "";
    if (!platform) return [];
    const handle = typeof row.handle === "string" ? row.handle.trim() : "";
    const followersRaw =
      typeof row.followers === "number" ? row.followers : Number(row.followers);
    const followers = Number.isFinite(followersRaw) ? Math.max(0, followersRaw) : 0;
    return [{ platform, handle, followers }];
  });
}

export function displayName(profile: {
  display_name: string | null;
  email: string;
}) {
  const name = profile.display_name?.trim();
  if (name) return name;
  return profile.email.split("@")[0] || "Account";
}

const MONTHS = [
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

export function memberSinceLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Member";
  return `Member since ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
