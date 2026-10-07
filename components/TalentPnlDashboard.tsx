"use client";

import { useMemo, useState } from "react";
import { PnlCurrencySelect } from "@/components/PnlCurrencySelect";
import { PnlDateRangeControl } from "@/components/PnlDateRangeControl";
import { StatCard } from "@/components/StatCard";
import { TalentPnlBreakdownList } from "@/components/TalentPnlBreakdownList";
import { TalentPnlContentTable } from "@/components/TalentPnlContentTable";
import { Text } from "@/components/Text";
import {
  buildTalentPnlByBrand,
  buildTalentPnlByNiche,
  buildTalentPnlRows,
  buildTalentPnlSummary,
} from "@/lib/data/selectors";
import { EMPTY_RATE_BOOK, type RateBook } from "@/lib/fx";
import type { PnlDateFilter } from "@/lib/pnlRange";
import { fmtMoney, type TrackerDetail } from "@/lib/tracker";

type TalentPnlDashboardProps = {
  allContent: TrackerDetail[];
  currency: string;
  currencies: string[];
  rates?: RateBook;
  className?: string;
};

export function TalentPnlDashboard({
  allContent,
  currency,
  currencies,
  rates = EMPTY_RATE_BOOK,
  className = "",
}: TalentPnlDashboardProps) {
  const [filter, setFilter] = useState<PnlDateFilter>({ range: "all" });
  const [reportCurrency, setReportCurrency] = useState(currency);

  const summary = useMemo(
    () => buildTalentPnlSummary(allContent, filter, undefined, reportCurrency, rates),
    [allContent, filter, reportCurrency, rates],
  );
  const rows = useMemo(
    () => buildTalentPnlRows(allContent, filter, undefined, reportCurrency, rates),
    [allContent, filter, reportCurrency, rates],
  );
  const byBrand = useMemo(
    () => buildTalentPnlByBrand(allContent, filter, reportCurrency, rates),
    [allContent, filter, reportCurrency, rates],
  );
  const byNiche = useMemo(
    () => buildTalentPnlByNiche(allContent, filter, reportCurrency, rates),
    [allContent, filter, reportCurrency, rates],
  );

  const { revenue, expenses, net, overdue } = summary;
  const money = (amount: number) => fmtMoney(amount, summary.currency);

  return (
    <div className={className}>
      <PnlDateRangeControl
        variant="toggle"
        heading="P&L Dashboard"
        onChange={setFilter}
        accessory={
          <PnlCurrencySelect
            value={reportCurrency}
            currencies={currencies}
            onChange={setReportCurrency}
          />
        }
      />

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4" data-tour="tour-pnl">
        <StatCard label="Total revenue" value={money(revenue)} tone="collab" />
        <StatCard
          label="Total expenses"
          value={money(expenses)}
          tone="payment"
        />
        <StatCard
          label="Net profit"
          value={money(net)}
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

      <TalentPnlContentTable rows={rows} currency={reportCurrency} className="mt-6" />

      {(byBrand.length > 0 || byNiche.length > 0) && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TalentPnlBreakdownList
            title="By brand"
            rows={byBrand}
            currency={summary.currency}
          />
          <TalentPnlBreakdownList
            title="By niche"
            rows={byNiche}
            currency={summary.currency}
          />
        </div>
      )}
    </div>
  );
}
