import { AccountProfile } from "@/components/AccountProfile";
import { AgencyFrame } from "@/components/AgencyFrame";
import { requireProfile } from "@/lib/auth/session";

export default async function AgencyProfilePage() {
  const profile = await requireProfile("agency");

  return (
    <AgencyFrame profile={profile}>
      <AccountProfile profile={profile} editHref="/workspace/profile/edit" />
    </AgencyFrame>
  );
}
