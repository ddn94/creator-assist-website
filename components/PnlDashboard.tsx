"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { CurrencySummaryCard } from "@/components/CurrencySummaryCard";
import { FilterPills } from "@/components/FilterPills";
import { PnlBrandList } from "@/components/PnlBrandList";
import { PnlTalentTable } from "@/components/PnlTalentTable";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { PNL_PERIODS, type PnlPeriod } from "@/lib/pnl";
import { useAgencyPnl } from "@/lib/useMockDb";

function toDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type PnlDashboardProps = {
  className?: string;
};

export function PnlDashboard({ className = "" }: PnlDashboardProps) {
  const [period, setPeriod] = useState<PnlPeriod>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const { currencies, talent, brands } = useAgencyPnl({
    range: period,
    from: period === "custom" ? appliedFrom : undefined,
    to: period === "custom" ? appliedTo : undefined,
  });

  const now = new Date();
  const last30 = new Date(now);
  last30.setDate(last30.getDate() - 30);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const customPresets = [
    { label: "All time", from: "", to: "" },
    { label: "Last 30 days", from: toDay(last30), to: "" },
    { label: "This year", from: toDay(yearStart), to: "" },
  ];

  const customLabel =
    !appliedFrom && !appliedTo
      ? "All time"
      : `${appliedFrom || "Start"} → ${appliedTo || "today"}`;

  return (
    <div className={className}>
      <FilterPills
        items={[...PNL_PERIODS]}
        value={period}
        onChange={(id) => setPeriod(id as PnlPeriod)}
      />

      {period === "custom" ? (
        <div className="mt-4 rounded-card border border-card-border bg-card p-4 shadow-card sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {customPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setFrom(preset.from);
                  setTo(preset.to);
                  setAppliedFrom(preset.from);
                  setAppliedTo(preset.to);
                }}
                className="rounded-full border border-border bg-background px-3.5 py-1.5 font-display text-sm font-semibold text-ink transition-colors hover:bg-card"
              >
                {preset.label}
              </button>
            ))}
            <Text variant="caption" className="ml-auto text-xs">
              Showing: {customLabel}
            </Text>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Text variant="label" className="mb-1">
                From
              </Text>
              <TextField
                type="date"
                size="sm"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <Text variant="label" className="mb-1">
                To
              </Text>
              <TextField
                type="date"
                size="sm"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="xs"
              onClick={() => {
                setAppliedFrom(from);
                setAppliedTo(to);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        {currencies[0] ? (
          <CurrencySummaryCard summary={currencies[0]} />
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)] lg:gap-5">
        <PnlTalentTable rows={talent} />
        <PnlBrandList rows={brands} />
      </div>
    </div>
  );
}
