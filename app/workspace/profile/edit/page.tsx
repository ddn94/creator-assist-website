import { AgencyEditForm } from "@/components/AgencyEditForm";
import { AgencyFrame } from "@/components/AgencyFrame";
import { BackLink } from "@/components/BackLink";
import { readString } from "@/lib/auth/onboarding";
import { requireProfile } from "@/lib/auth/session";

export default async function AgencyEditProfilePage() {
  const profile = await requireProfile("agency");

  return (
    <AgencyFrame profile={profile}>
      <div className="mb-4">
        <BackLink href="/workspace/profile" label="Back to profile" />
      </div>
      <AgencyEditForm
        agencyName={profile.agency_name ?? ""}
        name={profile.display_name ?? ""}
        country={profile.country ?? ""}
        rosterSize={readString(profile.onboarding, "rosterSize")}
      />
    </AgencyFrame>
  );
}
