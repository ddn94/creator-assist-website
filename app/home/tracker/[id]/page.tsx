import { notFound } from "next/navigation";
import { ContentDetailView } from "@/components/ContentDetailView";
import { AppFrame } from "@/components/AppFrame";
import { asAnswers, readPlatforms } from "@/lib/auth/profileAnswers";
import { requireProfile } from "@/lib/auth/session";
import { listContentChanges } from "@/lib/data/contentChanges";
import { getContentById } from "@/lib/data/contentQueries";
import { contentPlatformOptions } from "@/lib/platforms";
import { createClient } from "@/lib/supabase/server";

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from === "payments" ? "/home/payments" : "/home/tracker";
  const profile = await requireProfile("talent");
  const item = await getContentById(id);
  if (!item || item.creatorId !== profile.id) notFound();

  const currency = profile.currency?.trim() || "USD";
  const platformOptions = contentPlatformOptions(
    readPlatforms(asAnswers(profile.onboarding)).map((row) => row.platform),
    item.platform,
  );
  const activity = await listContentChanges(await createClient(), [id]);

  return (
    <AppFrame role="talent">
      <ContentDetailView
        initial={item}
        platformOptions={platformOptions}
        currency={currency}
        backHref={backHref}
        activity={activity}
      />
    </AppFrame>
  );
}
