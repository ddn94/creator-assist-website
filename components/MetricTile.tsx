import { Text } from "@/components/Text";
import { categoryCard } from "@/lib/ui";
import type { PnlMetric } from "@/lib/pnl";

const metricTones = {
  idea: categoryCard.idea,
  collab: categoryCard.paid,
  payment: categoryCard.payment,
  organic: categoryCard.organic,
  background: "bg-background text-ink",
} as const;

type MetricTileProps = {
  metric: PnlMetric;
  className?: string;
};

export function MetricTile({ metric, className = "" }: MetricTileProps) {
  return (
    <div
      className={[
        "rounded-2xl px-3 py-3.5 sm:px-4 sm:py-4 gap-3 flex flex-col",
        metricTones[metric.tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Text variant="caption" className="font-medium">
        {metric.label}
      </Text>
      <Text
        variant="stat"
        className={[
          "text-xl leading-none sm:text-2xl",
          metric.emphasize ? "text-danger!" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {metric.value}
      </Text>
    </div>
  );
}
