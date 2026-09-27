import { BackLink } from "@/components/BackLink";
import { AppFrame } from "@/components/AppFrame";
import { TalentProfileForm } from "@/components/TalentProfileForm";
import { readPlatforms, readString } from "@/lib/auth/profileAnswers";
import { requireProfile } from "@/lib/auth/session";

export default async function EditProfilePage() {
  const profile = await requireProfile("talent");

  return (
    <AppFrame role="talent" profile={profile}>
      <div className="mb-4">
        <BackLink href="/home/profile" label="Back to profile" />
      </div>
      <TalentProfileForm
        mode="edit"
        initial={{
          name: profile.display_name ?? "",
          ageBracket: readString(profile.onboarding, "ageBracket"),
          country: profile.country ?? "",
          niche: readString(profile.onboarding, "niche"),
          platforms: readPlatforms(profile.onboarding),
        }}
      />
    </AppFrame>
  );
}
