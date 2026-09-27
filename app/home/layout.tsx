import { TalentShell } from "@/components/RoleShell";
import { requireProfile } from "@/lib/auth/session";

export default async function HomeLayout({ children }: LayoutProps<"/home">) {
  const profile = await requireProfile("talent");
  return <TalentShell profile={profile}>{children}</TalentShell>;
}
