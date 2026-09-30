import { getProfile } from "@/lib/auth/session";
import {
  CONTENT_SELECT,
  mapContent,
  toListItem,
  type ContentRow,
} from "@/lib/data/map";
import type { TalentRecord } from "@/lib/data/talentRecords";
import type { TalentStatus } from "@/lib/talent";
import type { TrackerDetail, TrackerItem } from "@/lib/tracker";
import { createClient } from "@/lib/supabase/server";

export async function listMyContent(): Promise<TrackerDetail[]> {
  const profile = await getProfile();
  if (!profile) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_items")
    .select(CONTENT_SELECT)
    .eq("owner_id", profile.id)
    .order("updated_at", { ascending: false });
  return (data ?? []).map((row) => mapContent(row as ContentRow));
}

export async function listMyContentItems(): Promise<TrackerItem[]> {
  return (await listMyContent()).map(toListItem);
}

export async function getContentById(id: string): Promise<TrackerDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_items")
    .select(CONTENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return mapContent(data as ContentRow);
}

type RosterContentRow = {
  id: string;
  name: string;
  linked_user_id: string | null;
  currency: string | null;
  status: TalentStatus;
};

function contentFilterForRecords(records: RosterContentRow[]): string | null {
  const ownerIds = records.flatMap((row) =>
    row.linked_user_id ? [row.linked_user_id] : [],
  );
  const recordIds = records.map((row) => row.id);
  const parts: string[] = [];
  if (ownerIds.length > 0) parts.push(`owner_id.in.(${ownerIds.join(",")})`);
  if (recordIds.length > 0) {
    parts.push(`talent_record_id.in.(${recordIds.join(",")})`);
  }
  return parts.length > 0 ? parts.join(",") : null;
}

export async function listAgencyLinkedContent(): Promise<
  {
    content: TrackerDetail;
    talentName: string;
    currency: string;
    talentId: string;
    recordStatus: TalentStatus;
  }[]
> {
  const profile = await getProfile();
  if (!profile || profile.role !== "agency") return [];

  const supabase = await createClient();
  const { data: records } = await supabase
    .from("talent_records")
    .select("id, name, linked_user_id, currency, status")
    .eq("agency_id", profile.id);

  const roster = (records ?? []).flatMap((row) => {
    if (typeof row.id !== "string" || typeof row.name !== "string") return [];
    return [
      {
        id: row.id,
        name: row.name,
        linked_user_id:
          typeof row.linked_user_id === "string" ? row.linked_user_id : null,
        currency: typeof row.currency === "string" ? row.currency : null,
        status:
          row.status === "active" ||
          row.status === "invited" ||
          row.status === "disconnected" ||
          row.status === "requested"
            ? row.status
            : "record",
      } satisfies RosterContentRow,
    ];
  });
  const filter = contentFilterForRecords(roster);
  if (!filter) return [];

  const linkedIds = roster.flatMap((row) =>
    row.linked_user_id ? [row.linked_user_id] : [],
  );
  const { data: profiles } = linkedIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, currency")
        .in("id", linkedIds)
    : { data: [] };

  const profileById = new Map(
    (profiles ?? []).map((row) => [
      String(row.id),
      {
        displayName:
          typeof row.display_name === "string" && row.display_name.trim()
            ? row.display_name.trim()
            : null,
        currency:
          typeof row.currency === "string" && row.currency.trim()
            ? row.currency.trim()
            : null,
      },
    ]),
  );

  const byId = new Map(roster.map((row) => [row.id, row]));
  const byOwner = new Map(
    roster.flatMap((row) =>
      row.linked_user_id ? [[row.linked_user_id, row] as const] : [],
    ),
  );

  const { data } = await supabase
    .from("content_items")
    .select(CONTENT_SELECT)
    .or(filter)
    .order("updated_at", { ascending: false });

  return (data ?? []).flatMap((row) => {
    const mapped = mapContent(row as ContentRow);
    const record =
      (mapped.talentRecordId ? byId.get(mapped.talentRecordId) : undefined) ??
      (mapped.creatorId ? byOwner.get(mapped.creatorId) : undefined);
    if (!record) return [];
    const live = record.linked_user_id
      ? profileById.get(record.linked_user_id)
      : undefined;
    return [
      {
        content: mapped,
        talentName: live?.displayName || record.name,
        currency: live?.currency || record.currency || "USD",
        talentId: record.id,
        recordStatus: record.status,
      },
    ];
  });
}

export async function listContentForTalentRecord(
  record: TalentRecord,
): Promise<TrackerDetail[]> {
  const supabase = await createClient();
  const filter = contentFilterForRecords([
    {
      id: record.id,
      name: record.name,
      linked_user_id: record.linked_user_id,
      currency: record.currency,
      status: record.status,
    },
  ]);
  if (!filter) return [];
  const { data } = await supabase
    .from("content_items")
    .select(CONTENT_SELECT)
    .or(filter)
    .order("updated_at", { ascending: false });
  return (data ?? []).map((row) => mapContent(row as ContentRow));
}
