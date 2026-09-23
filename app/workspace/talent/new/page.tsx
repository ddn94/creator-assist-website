import { AddTalentForm } from "@/components/AddTalentForm";
import { AgencyFrame } from "@/components/AgencyFrame";
import { BackLink } from "@/components/BackLink";

export default function AddTalentPage() {
  return (
    <AgencyFrame
      title="Add talent"
      description="Track someone now, invite them whenever you're ready"
      back={<BackLink href="/workspace/talent" label="Talent" />}
    >
      <AddTalentForm />
    </AgencyFrame>
  );
}
