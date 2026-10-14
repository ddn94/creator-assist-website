import { cache } from "react";
import { redirect } from "next/navigation";
import {
  accessRedirect,
  subjectFromProfile,
} from "@/lib/auth/access";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asAnswers } from "@/lib/auth/profileAnswers";
import type { Profile, UserRole } from "@/lib/auth/types";

function asProfile(row: Record<string, unknown>): Profile {
  const role: UserRole = row.role === "agency" ? "agency" : "talent";
  return {
    id: String(row.id),
    email: String(row.email),
    role,
    display_name: typeof row.display_name === "string" ? row.display_name : null,
    avatar_path: typeof row.avatar_path === "string" ? row.avatar_path : null,
    agency_name: typeof row.agency_name === "string" ? row.agency_name : null,
    country: typeof row.country === "string" ? row.country : null,
    currency: typeof row.currency === "string" ? row.currency : null,
    onboarding: asAnswers(row.onboarding),
    onboarding_completed_at:
      typeof row.onboarding_completed_at === "string"
        ? row.onboarding_completed_at
        : null,
    last_seen_at: typeof row.last_seen_at === "string" ? row.last_seen_at : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export const getProfile = cache(async function getProfile(): Promise<Profile | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = !error && data?.claims.sub ? String(data.claims.sub) : "";
  if (!userId) return null;

  const { data: row } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (!row) return null;
  return asProfile(row as Record<string, unknown>);
});

/** Load profile or bail — access rules live in accessRedirect. */
export async function requireProfile(role: UserRole) {
  const profile = await getProfile();
  const to = accessRedirect(
    profile ? subjectFromProfile(profile) : null,
    { kind: "app", role },
  );
  if (to) redirect(to);
  return profile!;
}

export async function requireOnboarding(role: UserRole) {
  const profile = await getProfile();
  const to = accessRedirect(
    profile ? subjectFromProfile(profile) : null,
    { kind: "onboarding", role },
  );
  if (to) redirect(to);
  return profile!;
}

/** Signed-in user whose email is listed in ADMIN_EMAILS. */
export async function requireAdmin() {
  const profile = await getProfile();
  const to = accessRedirect(
    profile ? subjectFromProfile(profile) : null,
    { kind: "admin", isAdmin: isAdminEmail(profile?.email) },
  );
  if (to) redirect(to);
  return profile!;
}
