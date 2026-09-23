import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { AgencyFrame } from "@/components/AgencyFrame";
import { Button } from "@/components/Button";
import { TalentTable } from "@/components/TalentTable";
import { requireProfile } from "@/lib/auth/session";
import { listTalentRecords, toTalentItem } from "@/lib/auth/talentRecords";

export default async function WorkspaceTalentPage() {
  const profile = await requireProfile("agency");
  const items = (await listTalentRecords()).map(toTalentItem);

  return (
    <AgencyFrame
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
    </AgencyFrame>
  );
}
