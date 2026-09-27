import { WorkspaceShell } from "@/components/RoleShell";
import { requireProfile } from "@/lib/auth/session";

export default async function WorkspaceLayout({
  children,
}: LayoutProps<"/workspace">) {
  const profile = await requireProfile("agency");
  return <WorkspaceShell profile={profile}>{children}</WorkspaceShell>;
}
