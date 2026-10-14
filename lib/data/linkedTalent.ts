import type { PlatformAnswer } from "@/lib/auth/profileAnswers";
import { asAnswers, readPlatforms, readString } from "@/lib/auth/profileAnswers";
import { createClient } from "@/lib/supabase/server";

/** Live profile fields for a talent who has joined, keyed by talent_records.id. */
export type LinkedTalentMeta = {
  avatarPath: string | null;
  updatedAt: string;
  lastSeenAt: string | null;
  displayName: string | null;
  country: string | null;
  currency: string | null;
  niche: string | null;
  platforms: PlatformAnswer[];
};

/**
 * Maps talent_records.id -> linked account photo, presence, and live profile
 * fields (name / country / platforms) for every talent of this agency who has
 * joined Creator Assist. Requires profiles_select_linked_talent RLS.
 */
export async function getLinkedTalentAvatars(
  agencyId: string,
): Promise<Map<string, LinkedTalentMeta>> {
  const supabase = await createClient();
  const { data: records } = await supabase
    .from("talent_records")
    .select("id, linked_user_id")
    .eq("agency_id", agencyId)
    .not("linked_user_id", "is", null);

  const linked = (records ?? []).filter(
    (row): row is typeof row & { linked_user_id: string } =>
      typeof row.linked_user_id === "string",
  );
  if (linked.length === 0) return new Map();

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, avatar_path, updated_at, last_seen_at, display_name, country, currency, onboarding",
    )
    .in(
      "id",
      linked.map((row) => row.linked_user_id),
    );

  const byUserId = new Map(
    (profiles ?? []).map((row) => [
      String(row.id),
      {
        avatarPath: typeof row.avatar_path === "string" ? row.avatar_path : null,
        updatedAt: String(row.updated_at),
        lastSeenAt:
          typeof row.last_seen_at === "string" ? row.last_seen_at : null,
        displayName:
          typeof row.display_name === "string" && row.display_name.trim()
            ? row.display_name.trim()
            : null,
        country:
          typeof row.country === "string" && row.country.trim()
            ? row.country.trim()
            : null,
        currency:
          typeof row.currency === "string" && row.currency.trim()
            ? row.currency.trim()
            : null,
        niche: (() => {
          const value = readString(asAnswers(row.onboarding), "niche").trim();
          return value || null;
        })(),
        platforms: readPlatforms(asAnswers(row.onboarding)),
      } satisfies LinkedTalentMeta,
    ]),
  );

  const result = new Map<string, LinkedTalentMeta>();
  for (const row of linked) {
    const meta = byUserId.get(row.linked_user_id);
    if (meta) result.set(String(row.id), meta);
  }
  return result;
}
