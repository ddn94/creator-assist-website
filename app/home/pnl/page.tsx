import { TalentPnlDashboard } from "@/components/TalentPnlDashboard";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { listMyContent } from "@/lib/data/contentQueries";

export default async function TalentPnlPage() {
  const profile = await requireProfile("talent");
  const currency = profile.currency?.trim() || "USD";
  const allContent = await listMyContent();

  return (
    <AppFrame role="talent">
      <TalentPnlDashboard allContent={allContent} currency={currency} />
    </AppFrame>
  );
}
