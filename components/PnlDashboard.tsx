"use client";

import { useMemo, useState } from "react";
import { CurrencySummaryCard } from "@/components/CurrencySummaryCard";
import { PnlBrandList } from "@/components/PnlBrandList";
import { PnlDateRangeControl } from "@/components/PnlDateRangeControl";
import { PnlTalentTable } from "@/components/PnlTalentTable";
import {
  buildAgencyPnlBrands,
  buildAgencyPnlCurrencies,
  buildAgencyPnlTalent,
} from "@/lib/data/selectors";
import type { PnlDateFilter } from "@/lib/pnlRange";
import type { TrackerDetail } from "@/lib/tracker";

type LinkedRow = {
  content: TrackerDetail;
  talentName: string;
  currency: string;
  talentId: string;
};

type PnlDashboardProps = {
  linkedRows: LinkedRow[];
  homeCurrency: string;
  className?: string;
};

export function PnlDashboard({
  linkedRows,
  homeCurrency,
  className = "",
}: PnlDashboardProps) {
  const [filter, setFilter] = useState<PnlDateFilter>({ range: "all" });

  const currencies = useMemo(
    () => buildAgencyPnlCurrencies(linkedRows, homeCurrency, filter),
    [linkedRows, homeCurrency, filter],
  );
  const talent = useMemo(
    () => buildAgencyPnlTalent(linkedRows, homeCurrency, filter),
    [linkedRows, homeCurrency, filter],
  );
  const brands = useMemo(
    () => buildAgencyPnlBrands(linkedRows, homeCurrency, filter),
    [linkedRows, homeCurrency, filter],
  );

  return (
    <div className={className}>
      <PnlDateRangeControl onChange={setFilter} />

      <div className="mt-4" data-tour="tour-pnl">
        {currencies[0] ? (
          <CurrencySummaryCard summary={currencies[0]} />
        ) : (
          <div data-tour="tour-pnl-fallback" />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)] lg:gap-5">
        <PnlTalentTable rows={talent} />
        <PnlBrandList rows={brands} />
      </div>
    </div>
  );
}
