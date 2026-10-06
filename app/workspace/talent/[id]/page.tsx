import { notFound } from "next/navigation";
import { TalentDetailView } from "@/components/TalentDetailView";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { getTalentRecord } from "@/lib/data/talentRecords";
import { getLinkedTalentAvatars } from "@/lib/data/linkedTalent";
import { listContentChanges } from "@/lib/data/contentChanges";
import { listContentForTalentRecord } from "@/lib/data/contentQueries";
import { buildTalentDetailFromRecord } from "@/lib/data/selectors";
import { contentPlatformOptions } from "@/lib/platforms";
import { localToday } from "@/lib/localToday";
import { createClient } from "@/lib/supabase/server";
import { tourCoversPage } from "@/lib/tourGate";

type TalentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function TalentDetailPage({
  params,
  searchParams,
}: TalentDetailPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  if (await tourCoversPage()) return null;
  const fromOverview = from === "overview";
  const profile = await requireProfile("agency");
  const record = await getTalentRecord(id);
  if (!record) notFound();

  const supabase = await createClient();
  const [content, avatars] = await Promise.all([
    listContentForTalentRecord(record),
    getLinkedTalentAvatars(profile.id),
  ]);
  const activity = await listContentChanges(
    supabase,
    content.map((item) => item.id),
  );
  const talent = buildTalentDetailFromRecord(
    record,
    content,
    await localToday(),
    avatars.get(record.id) ?? null,
    activity,
  );

  return (
    <AppFrame role="agency" profile={profile}>
      <TalentDetailView
        talent={talent}
        inviteCode={record.invite_code}
        declinedAt={record.declined_at}
        recordEmail={record.email}
        backHref={fromOverview ? "/workspace" : "/workspace/talent"}
        backLabel={fromOverview ? "Overview" : "Talent"}
        fromOverview={fromOverview}
        canAddContent={record.status === "record"}
        joined={record.linked_user_id != null}
        platformOptions={contentPlatformOptions(
          record.platform ? [record.platform] : [],
        )}
      />
    </AppFrame>
  );
}
