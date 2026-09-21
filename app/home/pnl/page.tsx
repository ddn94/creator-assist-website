import { PageWrapper } from "@/components/PageWrapper";
import { TalentPnlDashboard } from "@/components/TalentPnlDashboard";
import { talentNav, talentShell } from "@/lib/home";

export default function TalentPnlPage() {
  return (
    <PageWrapper {...talentShell} navItems={talentNav}>
      <TalentPnlDashboard />
    </PageWrapper>
  );
}
