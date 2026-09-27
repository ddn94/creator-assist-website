import { PaymentsOverdueBadge } from "@/components/PaymentsOverdueBadge";
import { AppFrame } from "@/components/AppFrame";
import { PaymentList } from "@/components/PaymentList";
import { requireProfile } from "@/lib/auth/session";
import { listMyContent } from "@/lib/data/contentQueries";
import { buildTalentPayments } from "@/lib/data/selectors";

export default async function TalentPaymentsPage() {
  const profile = await requireProfile("talent");
  const currency = profile.currency?.trim() || "USD";
  const content = await listMyContent();
  const items = buildTalentPayments(content, currency);
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
