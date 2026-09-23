import { Suspense } from "react";
import { ContentTracker } from "@/components/ContentTracker";
import { TalentFrame } from "@/components/TalentFrame";

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;

  return (
    <TalentFrame title="Content Tracker">
      <Suspense fallback={null}>
        <ContentTracker defaultAddOpen={add === "1"} />
      </Suspense>
    </TalentFrame>
  );
}
