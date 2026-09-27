import { TalentProfileForm } from "@/components/TalentProfileForm";
import { readString } from "@/lib/auth/profileAnswers";
import { requireOnboarding } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const profile = await requireOnboarding("talent");

  return (
    <div className="relative z-10 flex min-h-dvh items-center justify-center bg-background">
      <TalentProfileForm
        mode="wizard"
        initial={{
          name: profile.display_name ?? "",
          niche: readString(profile.onboarding, "niche"),
        }}
      />
    </div>
  );
}
