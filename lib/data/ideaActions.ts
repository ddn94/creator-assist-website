"use server";

import {
  revalidateContent,
  requireTalentId,
} from "@/lib/data/actionHelpers";
import { addContentAction } from "@/lib/data/contentActions";
import type { IdeaStatus } from "@/lib/ideas";
import { DEFAULT_PLATFORM } from "@/lib/platforms";
import { createClient } from "@/lib/supabase/server";

export async function addIdeaAction(payload: {
  title: string;
  body: string;
  tags: string[];
  status: IdeaStatus;
}): Promise<{ id: string } | { error: string }> {
  try {
    const ownerId = await requireTalentId();
    if (!payload.title.trim()) return { error: "Title is required." };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ideas")
      .insert({
        owner_id: ownerId,
        title: payload.title.trim(),
        body: payload.body,
        tags: payload.tags,
        status: payload.status,
      })
      .select("id")
      .single();
    if (error || !data) return { error: "Could not add idea." };
    revalidateContent();
    return { id: data.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not add idea.",
    };
  }
}

export async function upsertIdeaAction(payload: {
  id: string;
  title: string;
  body: string;
  tags: string[];
  status: IdeaStatus;
  linkedContentItemId?: string | null;
}): Promise<{ error: string | null }> {
  try {
    await requireTalentId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("ideas")
      .update({
        title: payload.title.trim(),
        body: payload.body,
        tags: payload.tags,
        status: payload.status,
        linked_content_id: payload.linkedContentItemId ?? null,
      })
      .eq("id", payload.id);
    if (error) return { error: "Could not save idea." };
    revalidateContent();
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save idea.",
    };
  }
}

export async function deleteIdeaAction(
  id: string,
): Promise<{ error: string | null }> {
  try {
    await requireTalentId();
    const supabase = await createClient();
    const { error } = await supabase.from("ideas").delete().eq("id", id);
    if (error) return { error: "Could not delete idea." };
    revalidateContent();
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not delete idea.",
    };
  }
}

export async function turnIdeaIntoContentAction(
  ideaId: string,
): Promise<{ id: string } | { error: string }> {
  try {
    const ownerId = await requireTalentId();
    const supabase = await createClient();
    const { data: idea } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", ideaId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (!idea) return { error: "Idea not found." };
    if (typeof idea.linked_content_id === "string" && idea.linked_content_id) {
      return { id: idea.linked_content_id };
    }

    const created = await addContentAction({
      title: idea.title,
      platform: DEFAULT_PLATFORM,
      niche: Array.isArray(idea.tags) && idea.tags[0] ? idea.tags[0] : null,
      type: "organic",
      brandName: null,
      goLiveDate: null,
      notes: idea.body ?? "",
      ideaTitle: idea.title,
    });
    if ("error" in created) return created;

    const { data: linked, error: linkError } = await supabase
      .from("ideas")
      .update({ status: "used", linked_content_id: created.id })
      .eq("id", ideaId)
      .eq("owner_id", ownerId)
      .is("linked_content_id", null)
      .select("id")
      .maybeSingle();

    if (linkError || !linked) {
      await supabase.rpc("delete_owned_content", { p_id: created.id });
      const { data: current } = await supabase
        .from("ideas")
        .select("linked_content_id")
        .eq("id", ideaId)
        .eq("owner_id", ownerId)
        .maybeSingle();
      if (typeof current?.linked_content_id === "string" && current.linked_content_id) {
        return { id: current.linked_content_id };
      }
      return { error: "Could not turn this idea into a post." };
    }

    revalidateContent([`/overview/tracker/${created.id}`]);
    return { id: created.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not turn this idea into a post.",
    };
  }
}
