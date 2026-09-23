import type { ReactNode } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { avatarPublicUrl } from "@/lib/auth/avatar";
import { displayName } from "@/lib/auth/onboarding";
import { requireProfile } from "@/lib/auth/session";
import type { Profile } from "@/lib/auth/types";
import { workspaceNav } from "@/lib/workspace";

type FrameProps = {
  profile?: Profile;
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
};

export async function AgencyFrame({
  profile,
  children,
  title,
  description,
  action,
  back,
}: FrameProps) {
  const resolved = profile ?? (await requireProfile("agency"));
  return (
    <PageWrapper
      brand={resolved.agency_name?.trim() || "Workspace"}
      brandMeta="Agency workspace"
      userName={displayName(resolved)}
      userEmail={resolved.email}
      avatarUrl={avatarPublicUrl(resolved.avatar_path, resolved.updated_at)}
      profileHref="/workspace/profile"
      navItems={workspaceNav}
      title={title}
      description={description}
      action={action}
      back={back}
    >
      {children}
    </PageWrapper>
  );
}
