import { AddTalentForm } from "@/components/AddTalentForm";
import { AppFrame } from "@/components/AppFrame";
import { BackLink } from "@/components/BackLink";

export default function AddTalentPage() {
  return (
    <AppFrame
      role="agency"
      title="Add talent"
      description="Track someone now, invite them whenever you're ready"
      back={<BackLink href="/workspace/talent" label="Talent" />}
    >
      <AddTalentForm />
    </AppFrame>
  );
}
