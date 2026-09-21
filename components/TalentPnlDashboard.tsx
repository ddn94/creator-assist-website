"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { PillToggle } from "@/components/PillToggle";
import { StatCard } from "@/components/StatCard";
import { TalentPnlBreakdownList } from "@/components/TalentPnlBreakdownList";
import { TalentPnlContentTable } from "@/components/TalentPnlContentTable";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import {
  TALENT_PNL_RANGES,
  fmtMoney,
  type TalentPnlRange,
} from "@/lib/talentPnl";
import { useTalentPnl } from "@/lib/useMockDb";

function toDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type TalentPnlDashboardProps = {
  className?: string;
};

export function TalentPnlDashboard({ className = "" }: TalentPnlDashboardProps) {
  const [range, setRange] = useState<TalentPnlRange>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const { summary, rows, byBrand, byNiche } = useTalentPnl({
    range,
    from: range === "custom" ? appliedFrom : undefined,
    to: range === "custom" ? appliedTo : undefined,
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

  const { revenue, expenses, net, overdue } = summary;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text variant="heading" className="text-2xl sm:text-3xl">
          P&amp;L Dashboard
        </Text>
        <PillToggle
          items={TALENT_PNL_RANGES}
          value={range}
          onChange={(id) => setRange(id as TalentPnlRange)}
        />
      </div>

      {range === "custom" ? (
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

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total revenue" value={fmtMoney(revenue)} tone="collab" />
        <StatCard
          label="Total expenses"
          value={fmtMoney(expenses)}
          tone="payment"
        />
        <StatCard
          label="Net profit"
          value={fmtMoney(net)}
          tone="collab"
          valueClassName={net >= 0 ? "text-primary-hover!" : "text-danger!"}
        />
        <div className="rounded-card bg-card p-4 sm:p-5">
          <Text variant="caption" className="font-medium">
            Overdue
          </Text>
          <Text
            variant="stat"
            className={[
              "mt-2 text-2xl leading-none sm:text-3xl",
              overdue > 0 ? "text-danger!" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {overdue}
          </Text>
        </div>
      </div>

      <TalentPnlContentTable rows={rows} className="mt-6" />

      {(byBrand.length > 0 || byNiche.length > 0) && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TalentPnlBreakdownList title="By brand" rows={byBrand} />
          <TalentPnlBreakdownList title="By niche" rows={byNiche} />
        </div>
      )}
    </div>
  );
}
