import { AccountProfile } from "@/components/AccountProfile";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";

export default async function TalentProfilePage() {
  const profile = await requireProfile("talent");

  return (
    <AppFrame role="talent" profile={profile}>
      <AccountProfile
        profile={profile}
        editHref="/home/profile/edit"
        showAppLinks
      />
    </AppFrame>
  );
}
