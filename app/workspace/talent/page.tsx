import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/Button";
import { PageWrapper } from "@/components/PageWrapper";
import { TalentTable } from "@/components/TalentTable";
import { workspaceNav, workspaceShell } from "@/lib/workspace";

export default function WorkspaceTalentPage() {
  return (
    <PageWrapper
      {...workspaceShell}
      navItems={workspaceNav}
      title="Talent"
      description="Everyone you manage, on or off Creator Assist"
      action={
        <Button
          href="/workspace/talent/new"
          size="sm"
          variant="primary"
          iconLeft={<PlusIcon size={16} weight="bold" />}
          className="w-full sm:w-auto"
        >
          Add talent
        </Button>
      }
    >
      <TalentTable />
    </PageWrapper>
  );
}
