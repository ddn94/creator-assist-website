import { Suspense } from "react";
import { ContentTracker } from "@/components/ContentTracker";
import { AppFrame } from "@/components/AppFrame";
import { asAnswers, readPlatforms } from "@/lib/auth/profileAnswers";
import { requireProfile } from "@/lib/auth/session";
import { listMyContentItems } from "@/lib/data/contentQueries";
import { contentPlatformOptions } from "@/lib/platforms";

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;
  const profile = await requireProfile("talent");
  const items = await listMyContentItems();
  const platformOptions = contentPlatformOptions(
    readPlatforms(asAnswers(profile.onboarding)).map((row) => row.platform),
  );

  return (
    <AppFrame role="talent" title="Content Tracker">
      <Suspense fallback={null}>
        <ContentTracker
          items={items}
          platformOptions={platformOptions}
          defaultAddOpen={add === "1"}
        />
      </Suspense>
    </AppFrame>
  );
}
