import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/Button";
import { AppFrame } from "@/components/AppFrame";
import { TalentTable } from "@/components/TalentTable";
import { requireProfile } from "@/lib/auth/session";
import { listTalentRecords } from "@/lib/data/talentRecords";
import { getLinkedTalentAvatars } from "@/lib/data/linkedTalent";
import { listAgencyLinkedContent } from "@/lib/data/contentQueries";
import { buildTalentRoster } from "@/lib/data/selectors";
import { tourCoversPage } from "@/lib/tourGate";

export default async function WorkspaceTalentPage() {
  if (await tourCoversPage()) return null;
  const profile = await requireProfile("agency");
  const [records, linked, avatars] = await Promise.all([
    listTalentRecords(),
    listAgencyLinkedContent(),
    getLinkedTalentAvatars(profile.id),
  ]);
  const items = buildTalentRoster(records, linked, avatars);

  return (
    <AppFrame
      role="agency"
      profile={profile}
      title="Talent"
      description="Everyone you manage, on or off Creator Assist"
      action={
        <Button
          href="/workspace/talent/new"
          size="sm"
          variant="primary"
          iconLeft={<PlusIcon size={16} weight="bold" />}
          className="w-full sm:w-auto"
        >
          Add talent
        </Button>
      }
    >
      <TalentTable items={items} />
    </AppFrame>
  );
}
