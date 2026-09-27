import { PnlDashboard } from "@/components/PnlDashboard";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { listAgencyLinkedContent } from "@/lib/data/contentQueries";

export default async function WorkspacePnlPage() {
  const profile = await requireProfile("agency");
  const homeCurrency = profile.currency?.trim() || "USD";
  const linkedRows = await listAgencyLinkedContent();

  return (
    <AppFrame role="agency" title="P&L" description="Deal value across the roster">
      <PnlDashboard linkedRows={linkedRows} homeCurrency={homeCurrency} />
    </AppFrame>
  );
}
