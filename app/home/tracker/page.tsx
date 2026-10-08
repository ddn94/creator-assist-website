import { Suspense } from "react";
import { ContentTracker } from "@/components/ContentTracker";
import { AppFrame } from "@/components/AppFrame";
import { asAnswers, readPlatforms } from "@/lib/auth/profileAnswers";
import { requireProfile } from "@/lib/auth/session";
import { listMyContentItems } from "@/lib/data/contentQueries";
import { contentPlatformOptions } from "@/lib/platforms";
import { tourCoversPage } from "@/lib/tourGate";

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;
  if (await tourCoversPage()) return null;
  const profile = await requireProfile("talent");
  const items = await listMyContentItems();
  const tour = profile.onboarding.productTour === "pending";
  const tourItem = tour
    ? items.find((item) => item.title === "Sample paid collab") ?? items[0]
    : undefined;
  const platformOptions = contentPlatformOptions(
    readPlatforms(asAnswers(profile.onboarding)).map((row) => row.platform),
  );

  return (
    <AppFrame
      role="talent"
      title="Content Tracker"
      description="Concept to Go Live · every piece in one place"
    >
      <Suspense fallback={null}>
        <ContentTracker
          items={items}
          platformOptions={platformOptions}
          defaultAddOpen={add === "1"}
          initialStage={tourItem?.stage}
          tourItemId={tourItem?.id}
        />
      </Suspense>
    </AppFrame>
  );
}
