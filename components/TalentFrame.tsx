import type { ReactNode } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { avatarPublicUrl } from "@/lib/auth/avatar";
import { displayName } from "@/lib/auth/onboarding";
import { requireProfile } from "@/lib/auth/session";
import type { Profile } from "@/lib/auth/types";
import { talentNav } from "@/lib/home";

type FrameProps = {
  profile?: Profile;
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
};

export async function TalentFrame({
  profile,
  children,
  title,
  description,
  action,
  back,
}: FrameProps) {
  const resolved = profile ?? (await requireProfile("talent"));
  return (
    <PageWrapper
      brand="Creator Assist"
      userName={displayName(resolved)}
      userEmail={resolved.email}
      avatarUrl={avatarPublicUrl(resolved.avatar_path, resolved.updated_at)}
      profileHref="/home/profile"
      navItems={talentNav}
      title={title}
      description={description}
      action={action}
      back={back}
    >
      {children}
    </PageWrapper>
  );
}
