import { Suspense } from "react";
import { ContentTracker } from "@/components/ContentTracker";
import { PageWrapper } from "@/components/PageWrapper";
import { talentNav, talentShell } from "@/lib/home";

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;

  return (
    <PageWrapper
      {...talentShell}
      navItems={talentNav}
      title="Content Tracker"
    >
      <Suspense fallback={null}>
        <ContentTracker defaultAddOpen={add === "1"} />
      </Suspense>
    </PageWrapper>
  );
}
