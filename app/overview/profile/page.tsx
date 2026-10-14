import { AccountProfile } from "@/components/AccountProfile";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { getMyAgencyLink } from "@/lib/data/talentRecords";

export default async function TalentProfilePage() {
  const profile = await requireProfile("talent");
  const agencyLink = await getMyAgencyLink();

  return (
    <AppFrame role="talent" profile={profile}>
      <AccountProfile
        profile={profile}
        editHref="/overview/profile/edit"
        showAppLinks
        agencyLink={agencyLink}
      />
    </AppFrame>
  );
}
