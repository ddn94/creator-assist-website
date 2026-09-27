import type { ReactNode } from "react";
import { ShellGate } from "@/components/AppShell";
import { withAdminNav } from "@/lib/auth/admin";
import { avatarPublicUrl } from "@/lib/auth/avatar";
import { displayName } from "@/lib/auth/profileAnswers";
import { requireProfile } from "@/lib/auth/session";
import type { Profile, UserRole } from "@/lib/auth/types";
import { talentNav } from "@/lib/home";
import { workspaceNav } from "@/lib/workspace";

type AppFrameProps = {
  role: UserRole;
  profile?: Profile;
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
};

export async function AppFrame({
  role,
  profile,
  children,
  title,
  description,
  action,
  back,
}: AppFrameProps) {
  const resolved = profile ?? (await requireProfile(role));
  const agency = role === "agency";

  return (
    <ShellGate
      brand={
        agency
          ? resolved.agency_name?.trim() || "Workspace"
          : "Creator Assist"
      }
      brandMeta={agency ? "Agency workspace" : undefined}
      userName={displayName(resolved)}
      userEmail={resolved.email}
      avatarUrl={avatarPublicUrl(resolved.avatar_path, resolved.updated_at)}
      profileHref={agency ? "/workspace/profile" : "/home/profile"}
      navItems={withAdminNav(
        agency ? workspaceNav : talentNav,
        resolved.email,
      )}
      title={title}
      description={description}
      action={action}
      back={back}
    >
      {children}
    </ShellGate>
  );
}
