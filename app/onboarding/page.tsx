import { TalentOnboarding } from "@/components/TalentOnboarding";
import { requireOnboarding } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const profile = await requireOnboarding("talent");

  return (
    <div className="relative z-10 flex min-h-dvh items-center justify-center bg-background">
      <TalentOnboarding initialName={profile.display_name ?? ""} />
    </div>
  );
}
