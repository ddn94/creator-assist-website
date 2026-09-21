import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";

type NeedsAttentionCardProps = {
  name: string;
  project: string;
  detail: string;
  amount: string;
  overdue?: boolean;
  onOpen?: () => void;
  className?: string;
};

export function NeedsAttentionCard({
  name,
  project,
  detail,
  amount,
  overdue = false,
  onOpen,
  className = "",
}: NeedsAttentionCardProps) {
  const detailClass = ["mt-0.5", overdue ? "text-danger!" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={[
        "flex flex-col gap-2 rounded-card border bg-card px-4 py-3 shadow-card sm:flex-row sm:items-center sm:gap-6",
        overdue ? "border-danger/40" : "border-card-border",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center justify-between gap-3 sm:contents">
        <div className="flex min-w-0 items-center gap-2.5 sm:w-38 sm:shrink-0">
          <Avatar name={name} size="sm" />
          <Text variant="cardTitle" className="truncate text-sm">
            {name}
          </Text>
        </div>
        <Text variant="title" className="shrink-0 text-md sm:order-3 sm:ml-auto">
          {amount}
        </Text>
      </div>

      <div className="flex items-center justify-between gap-3 sm:contents">
        <div className="min-w-0 flex-1 sm:flex-1">
          <Text variant="cardTitle" className="truncate text-sm">
            {project}
          </Text>
          <Text variant="caption" className={detailClass}>
            {detail}
          </Text>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shrink-0 sm:order-4"
          onClick={onOpen}
        >
          Open
        </Button>
      </div>
    </div>
  );
}
