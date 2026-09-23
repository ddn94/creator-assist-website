import { IdeasBoard } from "@/components/IdeasBoard";
import { TalentFrame } from "@/components/TalentFrame";

export default function IdeasPage() {
  return (
    <TalentFrame
      title="Ideas"
      description="Brain dump · jot it down, organize later"
    >
      <IdeasBoard />
    </TalentFrame>
  );
}
