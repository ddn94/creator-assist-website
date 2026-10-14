import { AgencyProfileForm } from "@/components/AgencyProfileForm";
import { readString } from "@/lib/auth/profileAnswers";
import { requireOnboarding } from "@/lib/auth/session";

export default async function AgencyOnboardingPage() {
  const profile = await requireOnboarding("agency");

  return (
    <div className="relative z-10 flex min-h-dvh items-center justify-center bg-background">
      <AgencyProfileForm
        mode="wizard"
        initial={{
          agencyName: profile.agency_name ?? "",
          name: profile.display_name ?? "",
          rosterSize: readString(profile.onboarding, "rosterSize"),
        }}
      />
    </div>
  );
}
