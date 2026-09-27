import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
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
      profileHref="/home/profile"
      navItems={withAdminNav(talentNav, profile.email)}
    >
      {children}
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
    </AppShell>
  );
}
