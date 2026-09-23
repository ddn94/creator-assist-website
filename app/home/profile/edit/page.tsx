import { BackLink } from "@/components/BackLink";
import { EditProfileForm } from "@/components/EditProfileForm";
import { TalentFrame } from "@/components/TalentFrame";
import { readPlatforms, readString } from "@/lib/auth/onboarding";
import { requireProfile } from "@/lib/auth/session";

export default async function EditProfilePage() {
  const profile = await requireProfile("talent");

  return (
    <TalentFrame profile={profile}>
      <div className="mb-4">
        <BackLink href="/home/profile" label="Back to profile" />
      </div>
      <EditProfileForm
        name={profile.display_name ?? ""}
        ageBracket={readString(profile.onboarding, "ageBracket")}
        country={profile.country ?? ""}
        platforms={readPlatforms(profile.onboarding)}
      />
    </TalentFrame>
  );
}
