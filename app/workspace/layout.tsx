import { AgencyTourDeck } from "@/components/AgencyTourDeck";
import { WorkspaceShell } from "@/components/RoleShell";
import { requireProfile } from "@/lib/auth/session";

export default async function WorkspaceLayout({
  children,
}: LayoutProps<"/workspace">) {
  const profile = await requireProfile("agency");
  if (profile.onboarding.productTour === "pending") {
    return <AgencyTourDeck profile={profile} />;
  }
  return <WorkspaceShell profile={profile}>{children}</WorkspaceShell>;
}
