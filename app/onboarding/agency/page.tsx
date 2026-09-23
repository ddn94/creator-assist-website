import { AgencyOnboarding } from "@/components/AgencyOnboarding";
import { readString } from "@/lib/auth/onboarding";
import { requireOnboarding } from "@/lib/auth/session";

export default async function AgencyOnboardingPage() {
  const profile = await requireOnboarding("agency");

  return (
    <div className="relative z-10 flex min-h-dvh items-center justify-center bg-background">
      <AgencyOnboarding
        initialAgencyName={profile.agency_name ?? ""}
        initialName={profile.display_name ?? ""}
        initialRosterSize={readString(profile.onboarding, "rosterSize")}
      />
    </div>
  );
}
