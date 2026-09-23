"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AuthFormState } from "@/lib/auth/types";
import { hasSupabaseEnv, SUPABASE_SETUP_ERROR } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function followersFrom(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

export async function addTalent(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!hasSupabaseEnv()) return { error: SUPABASE_SETUP_ERROR, message: null };

  const status = formData.get("status") === "invited" ? "invited" : "record";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name) return { error: "Name is required.", message: null };
  if (status === "invited" && !email) {
    return { error: "Add an email to send an invite.", message: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("agency_add_talent", {
    p_name: name,
    p_email: email,
    p_status: status,
    p_platform: String(formData.get("platform") ?? ""),
    p_handle: String(formData.get("handle") ?? ""),
    p_followers: followersFrom(String(formData.get("community") ?? "")),
    p_niche: String(formData.get("niche") ?? ""),
    p_notes: String(formData.get("notes") ?? ""),
  });

  if (error || data == null || data === "") {
    const message = error?.message ?? "";
    if (message.toLowerCase().includes("email")) {
      return { error: "Add an email to send an invite.", message: null };
    }
    if (message.toLowerCase().includes("only an agency")) {
      return { error: "Only an agency can add talent.", message: null };
    }
    return { error: "Could not save this talent. Try again.", message: null };
  }

  revalidatePath("/workspace/talent");
  redirect(`/workspace/talent/${String(data)}`);
}

export async function inviteTalent(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!hasSupabaseEnv()) return { error: SUPABASE_SETUP_ERROR, message: null };
  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "");
  if (!id) return { error: "Missing talent.", message: null };

  const supabase = await createClient();
  const { error } = await supabase.rpc("agency_invite_talent", {
    p_id: id,
    p_email: email,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("email")) {
      return { error: "Add an email to send an invite.", message: null };
    }
    if (message.includes("already")) {
      return { error: "This talent already has an account.", message: null };
    }
    return { error: "Could not create an invite code. Try again.", message: null };
  }

  revalidatePath(`/workspace/talent/${id}`);
  redirect(`/workspace/talent/${id}`);
}
