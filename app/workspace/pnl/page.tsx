import { AgencyFrame } from "@/components/AgencyFrame";
import { PnlDashboard } from "@/components/PnlDashboard";

export default function WorkspacePnlPage() {
  return (
    <AgencyFrame title="P&L" description="Deal value across the roster">
      <PnlDashboard />
    </AgencyFrame>
  );
}
