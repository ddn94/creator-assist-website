import { MetricTile } from "@/components/MetricTile";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import type { PnlCurrencySummary } from "@/lib/pnl";

type CurrencySummaryCardProps = {
  summary: PnlCurrencySummary;
  className?: string;
};

export function CurrencySummaryCard({
  summary,
  className = "",
}: CurrencySummaryCardProps) {
  const talentLabel = `${summary.talentCount} talent`;

  return (
    <section
      className={[
        "rounded-card border border-card-border bg-card p-4 shadow-card sm:p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Text variant="title" className="text-base sm:text-lg">
          {summary.name}
        </Text>
        <StatusTag label={talentLabel} tone="record" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {summary.metrics.map((metric) => (
          <MetricTile key={metric.label} metric={metric} />
        ))}
      </div>
    </section>
  );
}
