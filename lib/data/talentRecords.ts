import type { TalentStatus } from "@/lib/talent";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type TalentRecord = {
  id: string;
  agency_id: string;
  name: string;
  email: string | null;
  status: "record" | "invited" | "active";
  invite_code: string | null;
  linked_user_id: string | null;
  platform: string | null;
  handle: string | null;
  followers: number | null;
  niche: string | null;
  notes: string | null;
  location: string | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
};

function asRecord(row: Record<string, unknown>): TalentRecord {
  const status: TalentStatus =
    row.status === "active" || row.status === "invited" ? row.status : "record";
  return {
    id: String(row.id),
    agency_id: String(row.agency_id),
    name: String(row.name),
    email: typeof row.email === "string" ? row.email : null,
    status,
    invite_code: typeof row.invite_code === "string" ? row.invite_code : null,
    linked_user_id:
      typeof row.linked_user_id === "string" ? row.linked_user_id : null,
    platform: typeof row.platform === "string" ? row.platform : null,
    handle: typeof row.handle === "string" ? row.handle : null,
    followers: typeof row.followers === "number" ? row.followers : null,
    niche: typeof row.niche === "string" ? row.niche : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    location: typeof row.location === "string" ? row.location : null,
    currency: typeof row.currency === "string" ? row.currency : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listTalentRecords(): Promise<TalentRecord[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent_records")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => asRecord(row as Record<string, unknown>));
}

export async function getTalentRecord(id: string): Promise<TalentRecord | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("talent_records")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return asRecord(data as Record<string, unknown>);
}
