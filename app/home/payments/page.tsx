import { PaymentsOverdueBadge } from "@/components/PaymentsOverdueBadge";
import { TalentPaymentTracker } from "@/components/TalentPaymentTracker";
import { PageWrapper } from "@/components/PageWrapper";
import { talentNav, talentShell } from "@/lib/home";

export default function TalentPaymentsPage() {
  return (
    <PageWrapper
      {...talentShell}
      navItems={talentNav}
      title="Payment Tracker"
      action={<PaymentsOverdueBadge />}
    >
      <TalentPaymentTracker />
    </PageWrapper>
  );
}
