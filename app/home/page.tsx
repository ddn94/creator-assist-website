import { PageWrapper } from "@/components/PageWrapper";
import { TalentOverview } from "@/components/TalentOverview";
import { talentNav, talentShell } from "@/lib/home";

export default function TalentHomePage() {
  return (
    <PageWrapper {...talentShell} navItems={talentNav}>
      <TalentOverview userName={talentShell.userName} />
    </PageWrapper>
  );
}
