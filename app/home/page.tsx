import { TalentFrame } from "@/components/TalentFrame";
import { TalentOverview } from "@/components/TalentOverview";
import { avatarPublicUrl } from "@/lib/auth/avatar";
import { displayName } from "@/lib/auth/onboarding";
import { requireProfile } from "@/lib/auth/session";

export default async function TalentHomePage() {
  const profile = await requireProfile("talent");

  return (
    <TalentFrame profile={profile}>
      <TalentOverview
        userName={displayName(profile)}
        avatarUrl={avatarPublicUrl(profile.avatar_path, profile.updated_at)}
      />
    </TalentFrame>
  );
}
