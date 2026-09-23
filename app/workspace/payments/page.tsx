import { AgencyFrame } from "@/components/AgencyFrame";
import { PaymentsTable } from "@/components/PaymentsTable";

export default function WorkspacePaymentsPage() {
  return (
    <AgencyFrame
      title="Payments"
      description="Every deal across the roster · you set invoice dates and terms"
    >
      <PaymentsTable />
    </AgencyFrame>
  );
}
