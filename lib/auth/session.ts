import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asAnswers } from "@/lib/auth/onboarding";
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
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getProfile(): Promise<Profile | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;
  return asProfile(data as Record<string, unknown>);
}

export async function requireProfile(role: UserRole) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== role) {
    redirect(profile.role === "agency" ? "/workspace" : "/home");
  }
  if (!profile.onboarding_completed_at) {
    redirect(profile.role === "agency" ? "/onboarding/agency" : "/onboarding");
  }
  return profile;
}

export async function requireOnboarding(role: UserRole) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== role) {
    redirect(profile.role === "agency" ? "/onboarding/agency" : "/onboarding");
  }
  if (profile.onboarding_completed_at) {
    redirect(profile.role === "agency" ? "/workspace" : "/home");
  }
  return profile;
}
