import { PnlDashboard } from "@/components/PnlDashboard";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { listAgencyLinkedContent } from "@/lib/data/contentQueries";
import { pnlMoneyContext } from "@/lib/data/exchangeRates";
import { tourCoversPage } from "@/lib/tourGate";

export default async function WorkspacePnlPage() {
  if (await tourCoversPage()) return null;
  const profile = await requireProfile("agency");
  const homeCurrency = profile.currency?.trim() || "USD";
  const linkedRows = await listAgencyLinkedContent();
  const money = await pnlMoneyContext(
    homeCurrency,
    linkedRows.map((row) => row.content),
  );

  return (
    <AppFrame role="agency" title="P&L" description="Revenue, expenses, and profit across the roster">
      <PnlDashboard
        linkedRows={linkedRows}
        homeCurrency={homeCurrency}
        currencies={money.currencies}
        rates={money.rates}
      />
    </AppFrame>
  );
}
