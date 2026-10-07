import { TalentPnlDashboard } from "@/components/TalentPnlDashboard";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { listMyContent } from "@/lib/data/contentQueries";
import { pnlMoneyContext } from "@/lib/data/exchangeRates";
import { tourCoversPage } from "@/lib/tourGate";

export default async function TalentPnlPage() {
  if (await tourCoversPage()) return null;
  const profile = await requireProfile("talent");
  const currency = profile.currency?.trim() || "USD";
  const allContent = await listMyContent();
  const money = await pnlMoneyContext(currency, allContent);

  return (
    <AppFrame role="talent">
      <TalentPnlDashboard
        allContent={allContent}
        currency={currency}
        currencies={money.currencies}
        rates={money.rates}
      />
    </AppFrame>
  );
}
