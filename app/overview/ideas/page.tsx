import { IdeasBoard } from "@/components/IdeasBoard";
import { AppFrame } from "@/components/AppFrame";
import { listMyIdeas } from "@/lib/data/ideaQueries";
import { tourCoversPage } from "@/lib/tourGate";

export default async function IdeasPage() {
  if (await tourCoversPage()) return null;
  const ideas = await listMyIdeas();

  return (
    <AppFrame
      role="talent"
      title="Ideas"
      description="Brain dump · jot it down, organize later"
    >
      <IdeasBoard ideas={ideas} />
    </AppFrame>
  );
}
