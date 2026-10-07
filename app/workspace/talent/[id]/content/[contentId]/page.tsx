import { notFound, redirect } from "next/navigation";
import { ContentDetailView } from "@/components/ContentDetailView";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { getTalentRecord } from "@/lib/data/talentRecords";
import { getAgencyCopyId, getContentById } from "@/lib/data/contentQueries";
import { pnlMoneyContext } from "@/lib/data/exchangeRates";
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
  if (!record) notFound();

  const [item, linked] = await Promise.all([
    getContentById(contentId),
    getLinkedTalentAvatars(profile.id),
  ]);
  if (!item) {
    const copyId = await getAgencyCopyId(contentId, talentId);
    if (copyId) {
      const suffix = from ? `?from=${encodeURIComponent(from)}` : "";
      redirect(`/workspace/talent/${talentId}/content/${copyId}${suffix}`);
    }
  }
  const belongsToRecord =
    item != null &&
    (item.talentRecordId === record.id ||
      (record.linked_user_id != null &&
        item.creatorId === record.linked_user_id));
  if (!belongsToRecord || !item) notFound();

  const currency =
    linked.get(record.id)?.currency || record.currency || "USD";
  const money = await pnlMoneyContext(currency, [item]);
  const platformOptions = contentPlatformOptions([item.platform], item.platform);

  return (
    <AppFrame role="agency" profile={profile}>
      <ContentDetailView
        initial={item}
        platformOptions={platformOptions}
        currency={currency}
        rates={money.rates}
        backHref={
          fromOverview
            ? `/workspace/talent/${talentId}?from=overview`
            : `/workspace/talent/${talentId}`
        }
        mode={item.agencyCreated || !item.creatorId ? "record" : "agency"}
      />
    </AppFrame>
  );
}
