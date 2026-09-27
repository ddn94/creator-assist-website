import { PaymentList } from "@/components/PaymentList";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { listAgencyLinkedContent } from "@/lib/data/contentQueries";
import { buildAgencyPayments } from "@/lib/data/selectors";

export default async function WorkspacePaymentsPage() {
  await requireProfile("agency");
  const linked = await listAgencyLinkedContent();
  const items = buildAgencyPayments(linked);

  return (
    <AppFrame
      role="agency"
      title="Payments"
      description="Every deal across the roster · you set invoice dates and terms"
    >
      <PaymentList mode="agency" items={items} />
    </AppFrame>
  );
}
