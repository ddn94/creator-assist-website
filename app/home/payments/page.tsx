import { PaymentsOverdueBadge } from "@/components/PaymentsOverdueBadge";
import { AppFrame } from "@/components/AppFrame";
import { PaymentList } from "@/components/PaymentList";
import { requireProfile } from "@/lib/auth/session";
import { listMyContent } from "@/lib/data/contentQueries";
import { buildTalentPayments } from "@/lib/data/selectors";
import { localToday, localTimeZone } from "@/lib/localToday";
import { tourCoversPage } from "@/lib/tourGate";

export default async function TalentPaymentsPage() {
  if (await tourCoversPage()) return null;
  const profile = await requireProfile("talent");
  const currency = profile.currency?.trim() || "USD";
  const [content, today, timeZone] = await Promise.all([
    listMyContent(),
    localToday(),
    localTimeZone(),
  ]);
  const items = buildTalentPayments(content, currency, today, timeZone);
  const overdueCount = items.filter((item) => item.status === "overdue").length;

  return (
    <AppFrame
      role="talent"
      title="Payment Tracker"
      action={<PaymentsOverdueBadge count={overdueCount} />}
    >
      <PaymentList mode="talent" items={items} />
    </AppFrame>
  );
}
