import { Avatar } from "@/components/Avatar";
import { StatusTag, type StatusTagTone } from "@/components/StatusTag";
import { Text } from "@/components/Text";

type RosterCardProps = {
  name: string;
  platforms: string;
  status: string;
  statusTone?: StatusTagTone;
  meta: string;
  className?: string;
};

export function RosterCard({
  name,
  platforms,
  status,
  statusTone = "record",
  meta,
  className = "",
}: RosterCardProps) {
  return (
    <div
      className={[
        "rounded-card border border-card-border bg-card p-4 shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center gap-3">
        <Avatar name={name} size="md" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <Text variant="cardTitle" className="min-w-0 truncate text-sm">
              {name}
            </Text>
            <StatusTag label={status} tone={statusTone} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Text variant="caption" className="min-w-0 truncate">
              {platforms}
            </Text>
            <Text variant="caption" className="shrink-0">
              {meta}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
