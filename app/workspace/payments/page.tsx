import { PageWrapper } from "@/components/PageWrapper";
import { PaymentsTable } from "@/components/PaymentsTable";
import { workspaceNav, workspaceShell } from "@/lib/workspace";

export default function WorkspacePaymentsPage() {
  return (
    <PageWrapper
      {...workspaceShell}
      navItems={workspaceNav}
      title="Payments"
      description="Every deal across the roster · you set invoice dates and terms"
    >
      <PaymentsTable />
    </PageWrapper>
  );
}
