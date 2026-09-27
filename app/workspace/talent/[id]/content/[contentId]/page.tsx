import { notFound } from "next/navigation";
import { ContentDetailView } from "@/components/ContentDetailView";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { getTalentRecord } from "@/lib/data/talentRecords";
import { getContentById } from "@/lib/data/contentQueries";
import { getLinkedTalentAvatars } from "@/lib/data/linkedTalent";
import { contentPlatformOptions } from "@/lib/platforms";

export default async function AgencyTalentContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; contentId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id: talentId, contentId } = await params;
  const { from } = await searchParams;
  const fromOverview = from === "overview";
  const profile = await requireProfile("agency");
  const record = await getTalentRecord(talentId);
  if (!record?.linked_user_id) notFound();

  const [item, linked] = await Promise.all([
    getContentById(contentId),
    getLinkedTalentAvatars(profile.id),
  ]);
  if (!item || item.creatorId !== record.linked_user_id) notFound();

  const currency = linked.get(record.id)?.currency || "USD";
  const platformOptions = contentPlatformOptions([item.platform], item.platform);

  return (
    <AppFrame role="agency" profile={profile}>
      <ContentDetailView
        initial={item}
        platformOptions={platformOptions}
        currency={currency}
        backHref={
          fromOverview
            ? `/workspace/talent/${talentId}?from=overview`
            : `/workspace/talent/${talentId}`
        }
        mode="agency"
      />
    </AppFrame>
  );
}
