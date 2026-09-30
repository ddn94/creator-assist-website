"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { revalidateContent } from "@/lib/data/actionHelpers";
import { flashToast } from "@/lib/toastFlash";
import type { AuthFormState } from "@/lib/auth/types";
import { withSupabaseAuthAction } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function followersFrom(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

export const addTalent = withSupabaseAuthAction(
  async (_prev, formData): Promise<AuthFormState> => {
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
      if (message.toLowerCase().includes("already connected")) {
        return {
          error: "This talent is already connected to an agency.",
          message: null,
        };
      }
      if (message.toLowerCase().includes("email")) {
        return { error: "Add an email to send an invite.", message: null };
      }
      if (message.toLowerCase().includes("only an agency")) {
        return { error: "Only an agency can add talent.", message: null };
      }
      return { error: "Could not save this talent. Try again.", message: null };
    }

    revalidatePath("/workspace/talent");
    await flashToast(`“${name}” was added.`);
    redirect(`/workspace/talent/${String(data)}`);
  },
);

export const inviteTalent = withSupabaseAuthAction(
  async (_prev, formData): Promise<AuthFormState> => {
    const id = String(formData.get("id") ?? "");
    const email = String(formData.get("email") ?? "");
    if (!id) return { error: "Missing talent.", message: null };

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("agency_invite_talent", {
      p_id: id,
      p_email: email,
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("already connected")) {
        return {
          error: "This talent is already connected to an agency.",
          message: null,
        };
      }
      if (message.includes("email")) {
        return { error: "Add an email to send an invite.", message: null };
      }
      if (message.includes("already")) {
        return {
          error: "This talent already has an account.",
          message: null,
        };
      }
      return {
        error: "Could not create an invite code. Try again.",
        message: null,
      };
    }

    revalidatePath(`/workspace/talent/${id}`);
    revalidatePath("/home/profile");
    return {
      error: null,
      message: data === "request" ? "Request sent." : "Invite sent.",
    };
  },
);

export async function deleteTalentRecordAction(
  id: string,
): Promise<{ error: string | null }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "agency") {
    return { error: "Only an agency can remove a record." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("agency_delete_record", { p_id: id });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("not been invited") || message.includes("only a record")) {
      return { error: "Only a record that has not been invited can be removed." };
    }
    if (message.includes("only an agency")) {
      return { error: "Only an agency can remove a record." };
    }
    return { error: "Could not remove this talent." };
  }

  revalidateContent();
  return { error: null };
}

export async function disconnectTalentLinkAction(
  id: string,
): Promise<{ error: string | null }> {
  const profile = await getProfile();
  if (!profile) return { error: "Sign in required." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("disconnect_talent_link", { p_id: id });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("only a connected")) {
      return { error: "Only a connected talent can be disconnected." };
    }
    if (message.includes("cannot disconnect")) {
      return { error: "You cannot disconnect this talent." };
    }
    return { error: "Could not disconnect." };
  }

  revalidateContent();
  revalidatePath("/home/profile");
  revalidatePath(`/workspace/talent/${id}`);
  return { error: null };
}

export async function respondConnectionRequestAction(
  id: string,
  accept: boolean,
): Promise<{ error: string | null }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "talent") {
    return { error: "Sign in as talent to answer this request." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_connection_request", {
    p_id: id,
    p_accept: accept,
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("disconnect from your current")) {
      return { error: "Disconnect from your current agency first." };
    }
    if (message.includes("not found")) {
      return { error: "That request is no longer waiting." };
    }
    return { error: "Could not answer that request." };
  }

  revalidateContent();
  revalidatePath("/home/profile");
  return { error: null };
}
