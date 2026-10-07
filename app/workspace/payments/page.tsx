import { PaymentList } from "@/components/PaymentList";
import { AppFrame } from "@/components/AppFrame";
import { requireProfile } from "@/lib/auth/session";
import { listAgencyLinkedContent } from "@/lib/data/contentQueries";
import { buildAgencyPayments } from "@/lib/data/selectors";
import { localToday, localTimeZone } from "@/lib/localToday";
import { tourCoversPage } from "@/lib/tourGate";

export default async function WorkspacePaymentsPage() {
  if (await tourCoversPage()) return null;
  await requireProfile("agency");
  const [linked, today, timeZone] = await Promise.all([
    listAgencyLinkedContent(),
    localToday(),
    localTimeZone(),
  ]);
  const items = buildAgencyPayments(linked, today, timeZone);

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
