import { StatCard, type StatCardTone } from "@/components/StatCard";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import type { PnlCurrencySummary, PnlMetric } from "@/lib/pnl";

const metricTone: Record<PnlMetric["tone"], StatCardTone> = {
  idea: "idea",
  collab: "collab",
  payment: "payment",
  organic: "organic",
  background: "organic",
};

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            footer={"\u00a0"}
            tone={metricTone[metric.tone]}
            valueClassName={metric.emphasize ? "text-danger!" : ""}
          />
        ))}
      </div>
    </section>
  );
}
