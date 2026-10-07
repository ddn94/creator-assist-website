import { TalentTourDeck } from "@/components/TalentTourDeck";
import { TalentShell } from "@/components/RoleShell";
import { requireProfile } from "@/lib/auth/session";

export default async function HomeLayout({ children }: LayoutProps<"/home">) {
  const profile = await requireProfile("talent");
  if (profile.onboarding.productTour === "pending") {
    return <TalentTourDeck profile={profile} />;
  }
  return <TalentShell profile={profile}>{children}</TalentShell>;
}
