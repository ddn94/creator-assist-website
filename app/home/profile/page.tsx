import { AccountProfile } from "@/components/AccountProfile";
import { TalentFrame } from "@/components/TalentFrame";
import { requireProfile } from "@/lib/auth/session";

export default async function TalentProfilePage() {
  const profile = await requireProfile("talent");

  return (
    <TalentFrame profile={profile}>
      <AccountProfile
        profile={profile}
        editHref="/home/profile/edit"
        showAppLinks
      />
    </TalentFrame>
  );
}
