import { PageWrapper } from "@/components/PageWrapper";
import { PnlDashboard } from "@/components/PnlDashboard";
import { workspaceNav, workspaceShell } from "@/lib/workspace";

export default function WorkspacePnlPage() {
  return (
    <PageWrapper
      {...workspaceShell}
      navItems={workspaceNav}
      title="P&L"
      description="Deal value across the roster, grouped by currency"
    >
      <PnlDashboard />
    </PageWrapper>
  );
}
