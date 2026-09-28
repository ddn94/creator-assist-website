import Link from "next/link";
import { Button } from "@/components/Button";
import { CategoryCard } from "@/components/CategoryCard";
import { CategoryPill } from "@/components/CategoryPill";
import { Text } from "@/components/Text";
import {
  STAGE_LABELS,
  contentCategory,
  contentPillLabel,
  formatLiveDate,
  nextStage,
  revisionBackStage,
  type TrackerItem,
} from "@/lib/tracker";

type TrackerItemCardProps = {
  item: TrackerItem;
  onAdvance?: (id: string) => void;
  onRevisionBack?: (id: string) => void;
};

export function TrackerItemCard({
  item,
  onAdvance,
  onRevisionBack,
}: TrackerItemCardProps) {
  const category = contentCategory(item.type);
  const pending = item.id.startsWith("pending-");
  const advanceTo = nextStage(item.stage);
  const backTo = revisionBackStage(item.stage);
  const meta = [
    item.platform,
    item.niche,
    item.type === "paid_collab" ? item.brandName : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <CategoryCard category={category} className="p-4">
      <CategoryPill category={category}>{contentPillLabel(item.type)}</CategoryPill>
      {pending ? (
        <span className="mt-2.5 block font-display text-sm font-bold leading-snug text-ink sm:text-base">
          {item.title}
        </span>
      ) : (
        <Link
          href={`/home/tracker/${item.id}`}
          className="mt-2.5 block font-display text-sm font-bold leading-snug text-ink hover:underline sm:text-base"
        >
          {item.title}
        </Link>
      )}
      <Text variant="caption" className="mt-1 text-sm">
        {meta}
      </Text>
      {item.goLiveDate ? (
        <Text variant="caption" className="mt-0.5">
          Live: {formatLiveDate(item.goLiveDate)}
        </Text>
      ) : null}
      {advanceTo ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          full
          className="mt-3 h-10 border-0 bg-card shadow-none"
          onClick={() => onAdvance?.(item.id)}
        >
          Move to {STAGE_LABELS[advanceTo]} →
        </Button>
      ) : null}
      {backTo ? (
        <button
          type="button"
          onClick={() => onRevisionBack?.(item.id)}
          className="mt-1 w-full cursor-pointer py-2 text-center font-sans text-xs text-muted transition-colors hover:text-ink"
        >
          Needs revisions? ← Back to {STAGE_LABELS[backTo]}
        </button>
      ) : null}
    </CategoryCard>
  );
}
