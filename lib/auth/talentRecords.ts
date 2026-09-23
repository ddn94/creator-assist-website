import { countryName } from "@/lib/countries";
import { fmtFollowers } from "@/lib/onboarding";
import type { TalentItem, TalentStatus } from "@/lib/talent";
import type { TalentRecord } from "@/lib/auth/types";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

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
    linked_user_id: typeof row.linked_user_id === "string" ? row.linked_user_id : null,
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

function statusLabel(status: TalentStatus) {
  if (status === "active") return "Active";
  if (status === "invited") return "Invited";
  return "Record only";
}

function activityLabel(record: TalentRecord) {
  if (record.status === "invited") return "Invite pending";
  if (record.status === "active") return "Joined";
  const date = new Date(record.created_at);
  if (Number.isNaN(date.getTime())) return "Added";
  return `Added ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

export function toTalentItem(record: TalentRecord): TalentItem {
  const platform = record.platform?.trim() || "";
  const handle = record.handle?.trim() || "";
  const platformLabel = platform
    ? handle
      ? `${platform} · ${handle}`
      : platform
    : "—";

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    status: record.status,
    statusLabel: statusLabel(record.status),
    platforms: platformLabel,
    platformsFull: platformLabel === "—" ? "No platform yet" : platformLabel,
    community:
      record.followers && record.followers > 0
        ? fmtFollowers(record.followers)
        : "—",
    niches: record.niche ?? "",
    location: record.location ? countryName(record.location) : "",
    liveDeals: null,
    outstanding: null,
    lastActivity: activityLabel(record),
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
