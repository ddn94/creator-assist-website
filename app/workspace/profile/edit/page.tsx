import { AgencyProfileForm } from "@/components/AgencyProfileForm";
import { AppFrame } from "@/components/AppFrame";
import { BackLink } from "@/components/BackLink";
import { readString } from "@/lib/auth/profileAnswers";
import { requireProfile } from "@/lib/auth/session";

export default async function AgencyEditProfilePage() {
  const profile = await requireProfile("agency");

  return (
    <AppFrame role="agency" profile={profile}>
      <div className="mb-4">
        <BackLink href="/workspace/profile" label="Back to profile" />
      </div>
      <AgencyProfileForm
        mode="edit"
        initial={{
          agencyName: profile.agency_name ?? "",
          name: profile.display_name ?? "",
          country: profile.country ?? "",
          rosterSize: readString(profile.onboarding, "rosterSize"),
        }}
      />
    </AppFrame>
  );
}
