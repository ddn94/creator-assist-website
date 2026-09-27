import { IdeasBoard } from "@/components/IdeasBoard";
import { AppFrame } from "@/components/AppFrame";
import { listMyIdeas } from "@/lib/data/ideaQueries";

export default async function IdeasPage() {
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
