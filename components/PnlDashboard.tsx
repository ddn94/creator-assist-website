"use client";

import { useMemo, useState } from "react";
import { CurrencySummaryCard } from "@/components/CurrencySummaryCard";
import { PnlBrandList } from "@/components/PnlBrandList";
import { PnlCurrencySelect } from "@/components/PnlCurrencySelect";
import { PnlDateRangeControl } from "@/components/PnlDateRangeControl";
import { PnlTalentTable } from "@/components/PnlTalentTable";
import {
  buildAgencyPnlBrands,
  buildAgencyPnlCurrencies,
  buildAgencyPnlTalent,
} from "@/lib/data/selectors";
import { EMPTY_RATE_BOOK, type RateBook } from "@/lib/fx";
import type { PnlDateFilter } from "@/lib/pnlRange";
import type { TalentStatus } from "@/lib/talent";
import type { TrackerDetail } from "@/lib/tracker";

type LinkedRow = {
  content: TrackerDetail;
  talentName: string;
  currency: string;
  talentId: string;
  recordStatus?: TalentStatus;
};

type PnlDashboardProps = {
  linkedRows: LinkedRow[];
  homeCurrency: string;
  currencies: string[];
  rates?: RateBook;
  className?: string;
};

export function PnlDashboard({
  linkedRows,
  homeCurrency,
  currencies,
  rates = EMPTY_RATE_BOOK,
  className = "",
}: PnlDashboardProps) {
  const [filter, setFilter] = useState<PnlDateFilter>({ range: "all" });
  const [reportCurrency, setReportCurrency] = useState(homeCurrency);

  const summaries = useMemo(
    () => buildAgencyPnlCurrencies(linkedRows, reportCurrency, filter, rates),
    [linkedRows, reportCurrency, filter, rates],
  );
  const talent = useMemo(
    () => buildAgencyPnlTalent(linkedRows, reportCurrency, filter, rates),
    [linkedRows, reportCurrency, filter, rates],
  );
  const brands = useMemo(
    () => buildAgencyPnlBrands(linkedRows, reportCurrency, filter, rates),
    [linkedRows, reportCurrency, filter, rates],
  );

  return (
    <div className={className}>
      <PnlDateRangeControl
        onChange={setFilter}
        accessory={
          <PnlCurrencySelect
            value={reportCurrency}
            currencies={currencies}
            onChange={setReportCurrency}
          />
        }
      />

      <div className="mt-4" data-tour="tour-pnl">
        {summaries[0] ? (
          <CurrencySummaryCard summary={summaries[0]} />
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
