"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currencyForCountry } from "@/lib/countries";
import {
  encodeGate,
  GATE_COOKIE,
  gateCookieOptions,
} from "@/lib/auth/gate";
import { appHome } from "@/lib/auth/routes";
import { tourStartPath } from "@/lib/tour";
import { getProfile } from "@/lib/auth/session";
import {
  asAnswers,
  cleanPlatforms,
  readString,
} from "@/lib/auth/profileAnswers";
import type { AuthFormState, UserRole } from "@/lib/auth/types";
import { avatarObjectPath } from "@/lib/auth/avatar";
import { hasSupabaseEnv, withSupabaseAuthAction, supabaseSetupError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { flashToast } from "@/lib/toastFlash";

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
  if (kind === "used") {
    return "That invite code has already been used. Already signed up? Sign in.";
  }
  if (kind === "email_mismatch") {
    return "Use the email your invite was sent to.";
  }
  if (kind === "talent" && role === "agency") {
    return "This code is for a creator account. Switch to Creator to sign up.";
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

export const joinWaitlist = withSupabaseAuthAction(
  async (_prev, formData): Promise<AuthFormState> => {
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
  },
);

export const signUp = withSupabaseAuthAction(
  async (_prev, formData): Promise<AuthFormState> => {
    const role: UserRole =
      formData.get("role") === "agency" ? "agency" : "talent";
    const email = normalizeEmail(
      String(formData.get("email") ?? formData.get("workEmail") ?? ""),
    );
    const password = String(formData.get("password") ?? "");
    const inviteCode = normalizeCode(String(formData.get("invite") ?? ""));

    if (!inviteCode) return { error: "Enter your invite code.", message: null };
    if (!email) return { error: "Enter your email.", message: null };
    if (password.length < 8) {
      return { error: "Use at least 8 characters.", message: null };
    }

    const supabase = await createClient();
    const { data: kind, error: lookupError } = await supabase.rpc(
      "lookup_invite",
      {
        p_code: inviteCode,
        p_email: email,
      },
    );

    if (lookupError || typeof kind !== "string") {
      return {
        error: "Could not check that invite code. Try again.",
        message: null,
      };
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
  },
);

export const signIn = withSupabaseAuthAction(
  async (_prev, formData): Promise<AuthFormState> => {
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const password = String(formData.get("password") ?? "");
    if (!email || !password) {
      return { error: "Enter your email and password.", message: null };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: authError(error.message), message: null };

    const profile = await getProfile();
    if (!profile) {
      return {
        error: "Signed in, but this account has no profile yet.",
        message: null,
      };
    }

    redirect(appHome(profile));
  },
);

export async function signOut() {
  const jar = await cookies();
  jar.set(GATE_COOKIE, "", { ...gateCookieOptions, maxAge: 0 });
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export const requestPasswordReset = withSupabaseAuthAction(
  async (_prev, formData): Promise<AuthFormState> => {
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    if (!email) return { error: "Enter your email.", message: null };

    const supabase = await createClient();
    const site = await origin();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${site}/auth/callback?next=/auth/reset`,
    });

    if (error && !error.message.toLowerCase().includes("user")) {
      return {
        error: "Could not send a reset link. Try again.",
        message: null,
      };
    }

    return {
      error: null,
      message:
        "If an account exists for that email, a reset link is on its way.",
    };
  },
);

export const changePassword = withSupabaseAuthAction(
  async (_prev, formData): Promise<AuthFormState> => {
    const current = String(formData.get("current") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    const profile = await getProfile();
    if (!profile) {
      return { error: "Sign in to change your password.", message: null };
    }
    if (!current) {
      return { error: "Enter your current password.", message: null };
    }
    if (password.length < 8) {
      return { error: "Use at least 8 characters.", message: null };
    }
    if (password !== confirm) {
      return { error: "Passwords don’t match.", message: null };
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: current,
    });
    if (signInError) {
      return { error: "Current password is incorrect.", message: null };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { error: "Could not update your password. Try again.", message: null };
    }

    await flashToast("Password updated.");
    redirect(profile.role === "agency" ? "/workspace/profile" : "/home/profile");
  },
);

export const updatePassword = withSupabaseAuthAction(
  async (_prev, formData): Promise<AuthFormState> => {
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
        error:
          "Open the reset link from your email, then choose a new password.",
        message: null,
      };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message, message: null };

    const profile = await getProfile();
    redirect(profile ? appHome(profile) : "/home");
  },
);

export async function saveProfileAnswers(
  answers: Record<string, unknown>,
  complete = false,
): Promise<{ error: string | null }> {
  if (!hasSupabaseEnv()) return supabaseSetupError();
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
  const startingTour = complete && !profile.onboarding_completed_at;
  if (startingTour) onboarding.productTour = "pending";
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
    const signed = encodeGate({
      sub: profile.id,
      role: profile.role,
      onboarded: true,
    });
    if (signed) {
      const jar = await cookies();
      jar.set(GATE_COOKIE, signed, gateCookieOptions);
    }
    redirect(
      startingTour
        ? tourStartPath(profile.role)
        : appHome({
            role: profile.role,
            onboarding_completed_at: new Date().toISOString(),
          }),
    );
  }
  return { error: null };
}

export async function completeProductTour(): Promise<void> {
  if (!hasSupabaseEnv()) return;
  const profile = await getProfile();
  if (!profile) return;
  const onboarding = { ...profile.onboarding, productTour: "done" };
  const supabase = await createClient();
  await supabase.from("profiles").update({ onboarding }).eq("id", profile.id);
  revalidatePath("/", "layout");
}

export async function setAvatarPath(path: string): Promise<{ error: string | null }> {
  if (!hasSupabaseEnv()) return supabaseSetupError();
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

export async function clearAvatar(): Promise<{ error: string | null }> {
  if (!hasSupabaseEnv()) return supabaseSetupError();
  const profile = await getProfile();
  if (!profile) return { error: "Sign in to update your photo." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", profile.id);
  if (error) return { error: "Could not remove your photo. Try again." };

  await supabase.storage.from("avatars").remove([avatarObjectPath(profile.id)]);
  revalidatePath("/", "layout");
  return { error: null };
}
