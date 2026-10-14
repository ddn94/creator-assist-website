import { AccountProfile } from "@/components/AccountProfile";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";

export default async function AgencyProfilePage() {
  const profile = await requireProfile("agency");

  return (
    <AppFrame role="agency" profile={profile}>
      <AccountProfile profile={profile} editHref="/workspace/profile/edit" />
    </AppFrame>
  );
}
