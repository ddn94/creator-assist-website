import { getProfile } from "@/lib/auth/session";
import {
  CONTENT_SELECT,
  mapContent,
  toListItem,
  type ContentRow,
} from "@/lib/data/map";
import type { TalentRecord } from "@/lib/data/talentRecords";
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

export async function listAgencyLinkedContent(): Promise<
  {
    content: TrackerDetail;
    talentName: string;
    currency: string;
    talentId: string;
  }[]
> {
  const profile = await getProfile();
  if (!profile || profile.role !== "agency") return [];

  const supabase = await createClient();
  const { data: records } = await supabase
    .from("talent_records")
    .select("id, name, linked_user_id, currency")
    .eq("agency_id", profile.id)
    .not("linked_user_id", "is", null);

  const linked = (records ?? []).filter(
    (row): row is typeof row & { linked_user_id: string } =>
      typeof row.linked_user_id === "string",
  );
  if (linked.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, currency")
    .in(
      "id",
      linked.map((row) => row.linked_user_id),
    );

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

  const byOwner = new Map(
    linked.map((row) => {
      const live = profileById.get(row.linked_user_id);
      return [
        row.linked_user_id,
        {
          talentId: String(row.id),
          name: live?.displayName || String(row.name),
          currency: live?.currency || "USD",
        },
      ] as const;
    }),
  );

  const { data } = await supabase
    .from("content_items")
    .select(CONTENT_SELECT)
    .in(
      "owner_id",
      linked.map((row) => row.linked_user_id),
    )
    .order("updated_at", { ascending: false });

  return (data ?? []).flatMap((row) => {
    const mapped = mapContent(row as ContentRow);
    const meta = byOwner.get(mapped.creatorId);
    if (!meta) return [];
    return [
      {
        content: mapped,
        talentName: meta.name,
        currency: meta.currency,
        talentId: meta.talentId,
      },
    ];
  });
}

export async function listContentForTalentRecord(
  record: TalentRecord,
): Promise<TrackerDetail[]> {
  if (!record.linked_user_id) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_items")
    .select(CONTENT_SELECT)
    .eq("owner_id", record.linked_user_id)
    .order("updated_at", { ascending: false });
  return (data ?? []).map((row) => mapContent(row as ContentRow));
}
