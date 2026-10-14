import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { ProductTour } from "@/components/ProductTour";
import { withAdminNav } from "@/lib/auth/admin";
import { avatarPublicUrl } from "@/lib/auth/avatar";
import { displayName } from "@/lib/auth/profileAnswers";
import type { Profile } from "@/lib/auth/types";
import { talentNav } from "@/lib/home";
import { workspaceNav } from "@/lib/workspace";

export function TalentShell({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  return (
    <AppShell
      brand="Creator Assist"
      userName={displayName(profile)}
      userEmail={profile.email}
      avatarUrl={avatarPublicUrl(profile.avatar_path, profile.updated_at)}
      profileHref="/overview/profile"
      navItems={withAdminNav(talentNav, profile.email)}
    >
      {children}
      {profile.onboarding.productTour === "pending" ? (
        <ProductTour role="talent" />
      ) : null}
    </AppShell>
  );
}

export function WorkspaceShell({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  return (
    <AppShell
      brand={profile.agency_name?.trim() || "Workspace"}
      brandMeta="Agency workspace"
      userName={displayName(profile)}
      userEmail={profile.email}
      avatarUrl={avatarPublicUrl(profile.avatar_path, profile.updated_at)}
      profileHref="/workspace/profile"
      navItems={withAdminNav(workspaceNav, profile.email)}
    >
      {children}
      {profile.onboarding.productTour === "pending" ? (
        <ProductTour role="agency" />
      ) : null}
    </AppShell>
  );
}
