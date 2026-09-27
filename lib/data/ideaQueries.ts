import { getProfile } from "@/lib/auth/session";
import { mapIdea, type IdeaRow } from "@/lib/data/map";
import type { IdeaItem } from "@/lib/ideas";
import { createClient } from "@/lib/supabase/server";

export async function listMyIdeas(): Promise<IdeaItem[]> {
  const profile = await getProfile();
  if (!profile) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("ideas")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapIdea(row as IdeaRow));
}
