import { getProfile } from "@/lib/auth/session";
import type { TalentStatus } from "@/lib/talent";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type TalentRecord = {
  id: string;
  agency_id: string;
  name: string;
  email: string | null;
  status: TalentStatus;
  invite_code: string | null;
  linked_user_id: string | null;
  disconnected_at: string | null;
  declined_at: string | null;
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
    row.status === "active" ||
      row.status === "invited" ||
      row.status === "disconnected" ||
      row.status === "requested"
      ? row.status
      : "record";
  return {
    id: String(row.id),
    agency_id: String(row.agency_id),
    name: String(row.name),
    email: typeof row.email === "string" ? row.email : null,
    status,
    invite_code: typeof row.invite_code === "string" ? row.invite_code : null,
    linked_user_id:
      typeof row.linked_user_id === "string" ? row.linked_user_id : null,
    disconnected_at:
      typeof row.disconnected_at === "string" ? row.disconnected_at : null,
    declined_at: typeof row.declined_at === "string" ? row.declined_at : null,
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

export type AgencyLink = {
  recordId: string;
  agencyName: string;
  status: "active" | "disconnected";
};

/** The agency this talent joined, if any. */
export async function getMyAgencyLink(): Promise<AgencyLink | null> {
  if (!hasSupabaseEnv()) return null;
  const profile = await getProfile();
  if (!profile || profile.role !== "talent") return null;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("talent_records")
    .select("id, agency_id, status, updated_at")
    .eq("linked_user_id", profile.id)
    .in("status", ["active", "disconnected"])
    .order("updated_at", { ascending: false });

  const records = rows ?? [];
  const record =
    records.find((row) => row.status === "active") ?? records[0] ?? null;
  if (!record || typeof record.id !== "string" || typeof record.agency_id !== "string") {
    return null;
  }

  const { data: agency } = await supabase
    .from("profiles")
    .select("agency_name, display_name")
    .eq("id", record.agency_id)
    .maybeSingle();
  const agencyName =
    (typeof agency?.agency_name === "string" && agency.agency_name.trim()) ||
    (typeof agency?.display_name === "string" && agency.display_name.trim()) ||
    "your agency";

  return {
    recordId: record.id,
    agencyName,
    status: record.status === "disconnected" ? "disconnected" : "active",
  };
}

export type ConnectionRequest = {
  recordId: string;
  agencyName: string;
};

/** Requests waiting for this talent to accept. */
export async function getMyConnectionRequests(): Promise<ConnectionRequest[]> {
  if (!hasSupabaseEnv()) return [];
  const profile = await getProfile();
  if (!profile || profile.role !== "talent") return [];

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("talent_records")
    .select("id, agency_id")
    .eq("status", "requested")
    .or(`request_user_id.eq.${profile.id},linked_user_id.eq.${profile.id}`);

  const requests = (rows ?? []).flatMap((row) => {
    if (typeof row.id !== "string" || typeof row.agency_id !== "string") return [];
    return [{ id: row.id, agencyId: row.agency_id }];
  });
  if (requests.length === 0) return [];

  const { data: agencies } = await supabase
    .from("profiles")
    .select("id, agency_name, display_name")
    .in(
      "id",
      requests.map((row) => row.agencyId),
    );
  const names = new Map(
    (agencies ?? []).map((row) => [
      String(row.id),
      (typeof row.agency_name === "string" && row.agency_name.trim()) ||
      (typeof row.display_name === "string" && row.display_name.trim()) ||
      "An agency",
    ]),
  );

  return requests.map((row) => ({
    recordId: row.id,
    agencyName: names.get(row.agencyId) ?? "An agency",
  }));
}
