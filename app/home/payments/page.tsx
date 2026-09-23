import { PaymentsOverdueBadge } from "@/components/PaymentsOverdueBadge";
import { TalentFrame } from "@/components/TalentFrame";
import { TalentPaymentTracker } from "@/components/TalentPaymentTracker";

export default function TalentPaymentsPage() {
  return (
    <TalentFrame title="Payment Tracker" action={<PaymentsOverdueBadge />}>
      <TalentPaymentTracker />
    </TalentFrame>
  );
}
