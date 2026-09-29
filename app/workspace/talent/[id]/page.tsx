import { notFound } from "next/navigation";
import { TalentDetailView } from "@/components/TalentDetailView";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { getTalentRecord } from "@/lib/data/talentRecords";
import { getLinkedTalentAvatars } from "@/lib/data/linkedTalent";
import { listContentForTalentRecord } from "@/lib/data/contentQueries";
import { buildTalentDetailFromRecord } from "@/lib/data/selectors";
import { contentPlatformOptions } from "@/lib/platforms";

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
  const fromOverview = from === "overview";
  const profile = await requireProfile("agency");
  const record = await getTalentRecord(id);
  if (!record) notFound();

  const [content, avatars] = await Promise.all([
    listContentForTalentRecord(record),
    getLinkedTalentAvatars(profile.id),
  ]);
  const talent = buildTalentDetailFromRecord(
    record,
    content,
    new Date(),
    avatars.get(record.id) ?? null,
  );

  return (
    <AppFrame role="agency" profile={profile}>
      <TalentDetailView
        talent={talent}
        inviteCode={record.invite_code}
        recordEmail={record.email}
        backHref={fromOverview ? "/workspace" : "/workspace/talent"}
        backLabel={fromOverview ? "Overview" : "Talent"}
        fromOverview={fromOverview}
        canAddContent={record.status === "record"}
        platformOptions={contentPlatformOptions(
          record.platform ? [record.platform] : [],
        )}
      />
    </AppFrame>
  );
}
