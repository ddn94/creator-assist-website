import { IdeasBoard } from "@/components/IdeasBoard";
import { PageWrapper } from "@/components/PageWrapper";
import { talentNav, talentShell } from "@/lib/home";

export default function IdeasPage() {
  return (
    <PageWrapper
      {...talentShell}
      navItems={talentNav}
      title="Ideas"
      description="Brain dump · jot it down, organize later"
    >
      <IdeasBoard />
    </PageWrapper>
  );
}
