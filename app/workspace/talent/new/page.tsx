import { AddTalentForm } from "@/components/AddTalentForm";
import { BackLink } from "@/components/BackLink";
import { PageWrapper } from "@/components/PageWrapper";
import { workspaceNav, workspaceShell } from "@/lib/workspace";

export default function AddTalentPage() {
  return (
    <PageWrapper
      {...workspaceShell}
      navItems={workspaceNav}
      title="Add talent"
      description="Track someone now, invite them whenever you're ready"
      back={<BackLink href="/workspace/talent" label="Talent" />}
    >
      <AddTalentForm />
    </PageWrapper>
  );
}
