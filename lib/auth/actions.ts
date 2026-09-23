"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currencyForCountry } from "@/lib/countries";
import { appHome } from "@/lib/auth/routes";
import { getProfile } from "@/lib/auth/session";
import {
  asAnswers,
  readString,
  type PlatformAnswer,
} from "@/lib/auth/onboarding";
import type { AuthFormState, UserRole } from "@/lib/auth/types";
import { avatarObjectPath } from "@/lib/auth/avatar";
import { hasSupabaseEnv, SUPABASE_SETUP_ERROR } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function normalizeCode(raw: string) {
  return raw.replace(/\s+/g, "").toUpperCase();
}

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function inviteError(kind: string, role: UserRole) {
  if (kind === "used") return "That invite code has already been used.";
  if (kind === "email_mismatch") {
    return "Use the email address this invite was issued for.";
  }
  if (kind === "talent" && role === "agency") {
    return "This code is for a talent account. Switch to Talent and sign up there.";
  }
  if (kind === "invalid") return "That invite code isn’t valid.";
  return null;
}

function authError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "Email or password is incorrect.";
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with that email already exists. Sign in instead.";
  }
  if (lower.includes("database error")) {
    return "Could not create the account with that invite. Check the code and email.";
  }
  return message;
}

export async function joinWaitlist(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!hasSupabaseEnv()) return { error: SUPABASE_SETUP_ERROR, message: null };
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return { error: "Enter your email.", message: null };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_waitlist", { p_email: email });
  if (error) {
    const message = error.message.toLowerCase().includes("valid email")
      ? "Enter a valid email."
      : "Could not join the waitlist. Try again.";
    return { error: message, message: null };
  }

  return {
    error: null,
    message: "You’re on the list. We’ll email your invite code.",
  };
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!hasSupabaseEnv()) return { error: SUPABASE_SETUP_ERROR, message: null };

  const role: UserRole = formData.get("role") === "agency" ? "agency" : "talent";
  const email = normalizeEmail(String(formData.get("email") ?? formData.get("workEmail") ?? ""));
  const password = String(formData.get("password") ?? "");
  const inviteCode = normalizeCode(String(formData.get("invite") ?? ""));
  const rosterSize = String(formData.get("rosterSize") ?? "").trim();

  if (!inviteCode) return { error: "Enter your invite code.", message: null };
  if (!email) return { error: "Enter your email.", message: null };
  if (password.length < 8) {
    return { error: "Use at least 8 characters.", message: null };
  }

  const supabase = await createClient();
  const { data: kind, error: lookupError } = await supabase.rpc("lookup_invite", {
    p_code: inviteCode,
    p_email: email,
  });

  if (lookupError || typeof kind !== "string") {
    return { error: "Could not check that invite code. Try again.", message: null };
  }

  const blocked = inviteError(kind, role);
  if (blocked) return { error: blocked, message: null };
  if (kind !== "waitlist" && kind !== "talent") {
    return { error: "That invite code isn’t valid.", message: null };
  }

  const site = await origin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${site}/auth/callback`,
      data: {
        invite_code: inviteCode,
        role: kind === "talent" ? "talent" : role,
        roster_size: role === "agency" ? rosterSize : "",
      },
    },
  });

  if (error) return { error: authError(error.message), message: null };

  if (!data.session) {
    return {
      error: null,
      message: "Check your email to confirm your account, then sign in.",
    };
  }

  const profile = await getProfile();
  redirect(profile ? appHome(profile) : "/onboarding");
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!hasSupabaseEnv()) return { error: SUPABASE_SETUP_ERROR, message: null };

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password.", message: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authError(error.message), message: null };

  const profile = await getProfile();
  if (!profile) {
    return {
      error: "Signed in, but this account has no profile yet.",
      message: null,
    };
  }

  redirect(appHome(profile));
}

export async function signOut() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!hasSupabaseEnv()) return { error: SUPABASE_SETUP_ERROR, message: null };
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return { error: "Enter your email.", message: null };

  const supabase = await createClient();
  const site = await origin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/callback?next=/auth/reset`,
  });

  if (error && !error.message.toLowerCase().includes("user")) {
    return { error: "Could not send a reset link. Try again.", message: null };
  }

  return {
    error: null,
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!hasSupabaseEnv()) return { error: SUPABASE_SETUP_ERROR, message: null };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    return { error: "Use at least 8 characters.", message: null };
  }
  if (password !== confirm) {
    return { error: "Passwords don’t match.", message: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Open the reset link from your email, then choose a new password.",
      message: null,
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message, message: null };

  const profile = await getProfile();
  redirect(profile ? appHome(profile) : "/home");
}

function cleanPlatforms(value: unknown): PlatformAnswer[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const platform = typeof row.platform === "string" ? row.platform.trim() : "";
    if (!platform) return [];
    const handle = typeof row.handle === "string" ? row.handle.trim() : "";
    const followers = Number(row.followers);
    return [
      {
        platform,
        handle,
        followers: Number.isFinite(followers) ? Math.max(0, Math.round(followers)) : 0,
      },
    ];
  });
}

export async function saveProfileAnswers(
  answers: Record<string, unknown>,
  complete = false,
): Promise<{ error: string | null }> {
  if (!hasSupabaseEnv()) return { error: SUPABASE_SETUP_ERROR };
  const profile = await getProfile();
  if (!profile) return { error: "Sign in to save your profile." };

  let cleaned: Record<string, unknown>;
  try {
    cleaned = asAnswers(JSON.parse(JSON.stringify(answers)));
  } catch {
    return { error: "Could not save those answers." };
  }

  if (JSON.stringify(cleaned).length > 50_000) {
    return { error: "That profile is too large to save." };
  }

  if ("platforms" in cleaned) {
    cleaned.platforms = cleanPlatforms(cleaned.platforms);
  }

  const name = readString(cleaned, "name").trim();
  const agencyName = readString(cleaned, "agencyName").trim();
  const country = readString(cleaned, "country").trim();

  if (complete) {
    if (profile.role === "agency") {
      if (!agencyName || !name || !country) {
        return { error: "Agency name, your name, and country are required." };
      }
    } else if (!name || !country) {
      return { error: "Name and country are required." };
    }
  }

  const onboarding = { ...profile.onboarding, ...cleaned };
  const patch: Record<string, unknown> = { onboarding };

  if ("name" in cleaned) patch.display_name = name || profile.display_name;
  if ("agencyName" in cleaned) patch.agency_name = agencyName || null;
  if ("country" in cleaned && country) {
    patch.country = country;
    patch.currency = currencyForCountry(country);
  }
  if (complete) patch.onboarding_completed_at = new Date().toISOString();

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
  if (error) return { error: "Could not save your profile. Try again." };

  revalidatePath("/", "layout");
  if (complete) {
    redirect(
      appHome({
        role: profile.role,
        onboarding_completed_at: new Date().toISOString(),
      }),
    );
  }
  return { error: null };
}

export async function setAvatarPath(path: string): Promise<{ error: string | null }> {
  if (!hasSupabaseEnv()) return { error: SUPABASE_SETUP_ERROR };
  const profile = await getProfile();
  if (!profile) return { error: "Sign in to update your photo." };

  const expected = avatarObjectPath(profile.id);
  if (path !== expected) return { error: "Could not save that photo." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: path })
    .eq("id", profile.id);
  if (error) return { error: "Could not save your photo. Try again." };

  revalidatePath("/", "layout");
  return { error: null };
}
