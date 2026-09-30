import { AccountProfile } from "@/components/AccountProfile";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { getMyAgencyLink, getMyConnectionRequests } from "@/lib/data/talentRecords";

export default async function TalentProfilePage() {
  const profile = await requireProfile("talent");
  const [agencyLink, connectionRequests] = await Promise.all([
    getMyAgencyLink(),
    getMyConnectionRequests(),
  ]);

  return (
    <AppFrame role="talent" profile={profile}>
      <AccountProfile
        profile={profile}
        editHref="/home/profile/edit"
        showAppLinks
        agencyLink={agencyLink}
        connectionRequests={connectionRequests}
      />
    </AppFrame>
  );
}
