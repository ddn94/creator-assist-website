import { PageWrapper } from "@/components/PageWrapper";
import { TalentProfile } from "@/components/TalentProfile";
import { talentNav, talentShell } from "@/lib/home";

export default function TalentProfilePage() {
  return (
    <PageWrapper {...talentShell} navItems={talentNav}>
      <TalentProfile />
    </PageWrapper>
  );
}
