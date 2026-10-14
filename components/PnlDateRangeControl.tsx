"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { DateField } from "@/components/DateField";
import { FilterPills } from "@/components/FilterPills";
import { PillToggle } from "@/components/PillToggle";
import { Text } from "@/components/Text";
import {
  PNL_PERIODS,
  type PnlDateFilter,
  type PnlRangeKind,
} from "@/lib/pnlRange";

type PnlDateRangeControlProps = {
  onChange: (filter: PnlDateFilter) => void;
  /** Agency uses filter pills; talent uses a compact toggle next to a heading. */
  variant?: "pills" | "toggle";
  heading?: string;
  /** Sits in the header row, next to the title or the period control. */
  accessory?: ReactNode;
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
  accessory,
  className = "",
}: PnlDateRangeControlProps) {
  const [range, setRange] = useState<PnlRangeKind>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  function selectRange(next: PnlRangeKind) {
    setRange(next);
    onChange(filterFor(next, appliedFrom, appliedTo));
  }

  function applyCustom() {
    setAppliedFrom(from);
    setAppliedTo(to);
    onChange(filterFor("custom", from, to));
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
        <div className="flex flex-wrap items-center gap-3">
          <Text as="h1" variant="heading" className="text-2xl sm:text-3xl">
            {heading}
          </Text>
          {accessory}
        </div>
        {periods}
      </div>
    ) : (
      <div className="flex flex-wrap items-center justify-between gap-3">
        {accessory}
        {periods}
      </div>
    );

  return (
    <div className={className}>
      {header}

      {range === "custom" ? (
        <div className="mt-4 rounded-card border border-card-border bg-card p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full min-w-0 sm:w-56">
              <Text variant="label" className="mb-1">
                From
              </Text>
              <DateField size="sm" full value={from} onChange={setFrom} />
            </div>
            <div className="w-full min-w-0 sm:w-56">
              <Text variant="label" className="mb-1">
                To
              </Text>
              <DateField size="sm" full value={to} onChange={setTo} />
            </div>
            <Button type="button" size="sm" onClick={applyCustom}>
              Apply
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
