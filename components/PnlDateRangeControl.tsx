"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { FilterPills } from "@/components/FilterPills";
import { PillToggle } from "@/components/PillToggle";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import {
  PNL_PERIODS,
  pnlCustomPresets,
  type PnlDateFilter,
  type PnlRangeKind,
} from "@/lib/pnlRange";

type PnlDateRangeControlProps = {
  onChange: (filter: PnlDateFilter) => void;
  /** Agency uses filter pills; talent uses a compact toggle next to a heading. */
  variant?: "pills" | "toggle";
  heading?: string;
  className?: string;
};

function filterFor(
  range: PnlRangeKind,
  from: string,
  to: string,
): PnlDateFilter {
  return {
    range,
    from: range === "custom" ? from || undefined : undefined,
    to: range === "custom" ? to || undefined : undefined,
  };
}

export function PnlDateRangeControl({
  onChange,
  variant = "pills",
  heading,
  className = "",
}: PnlDateRangeControlProps) {
  const [range, setRange] = useState<PnlRangeKind>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  function selectRange(next: PnlRangeKind) {
    setRange(next);
    onChange(filterFor(next, appliedFrom, appliedTo));
  }

  function applyCustom(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    setAppliedFrom(nextFrom);
    setAppliedTo(nextTo);
    onChange(filterFor("custom", nextFrom, nextTo));
  }

  const customLabel =
    !appliedFrom && !appliedTo
      ? "All time"
      : `${appliedFrom || "Start"} → ${appliedTo || "today"}`;

  const periods =
    variant === "toggle" ? (
      <PillToggle
        items={[...PNL_PERIODS]}
        value={range}
        onChange={(id) => selectRange(id as PnlRangeKind)}
      />
    ) : (
      <FilterPills
        items={[...PNL_PERIODS]}
        value={range}
        onChange={(id) => selectRange(id as PnlRangeKind)}
      />
    );

  const header =
    heading != null ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text as="h1" variant="heading" className="text-2xl sm:text-3xl">
          {heading}
        </Text>
        {periods}
      </div>
    ) : (
      periods
    );

  return (
    <div className={className}>
      {header}

      {range === "custom" ? (
        <div className="mt-4 rounded-card border border-card-border bg-card p-4 shadow-card sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {pnlCustomPresets().map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyCustom(preset.from, preset.to)}
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
              onClick={() => applyCustom(from, to)}
            >
              Apply
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
