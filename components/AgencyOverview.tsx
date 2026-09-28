"use client";

import { NeedsAttentionList } from "@/components/NeedsAttentionList";
import { RosterList, type RosterItem } from "@/components/RosterList";
import { StatCard } from "@/components/StatCard";
import { Text } from "@/components/Text";
import type { AttentionItem } from "@/lib/data/selectors";
import type { PaymentItem } from "@/lib/payments";

type AgencyMoneyStats = {
  outstanding: string;
  overdue: string;
  received: string;
  outstandingFooter: string;
  overdueFooter: string;
  receivedFooter: string;
};

type AgencyOverviewProps = {
  talentCount: number;
  talentFooter: string;
  roster: RosterItem[];
  moneyStats: AgencyMoneyStats;
  attention: AttentionItem[];
  payments: PaymentItem[];
};

function EmptyPanel({ children }: { children: string }) {
  return (
    <div className="rounded-card border border-card-border bg-card px-4 py-8 text-center shadow-card">
      <Text variant="description">{children}</Text>
    </div>
  );
}

export function AgencyOverview({
  talentCount,
  talentFooter,
  roster,
  moneyStats,
  attention,
  payments,
}: AgencyOverviewProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Talent"
          value={String(talentCount)}
          footer={talentFooter}
          tone="collab"
        />
        <StatCard
          label="Outstanding"
          value={moneyStats.outstanding}
          footer={moneyStats.outstandingFooter}
          tone="payment"
        />
        <StatCard
          label="Overdue"
          value={moneyStats.overdue}
          footer={moneyStats.overdueFooter}
          tone="organic"
          valueClassName="text-danger!"
        />
        <StatCard
          label="Received this month"
          value={moneyStats.received}
          footer={moneyStats.receivedFooter}
          tone="idea"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8">
        <section className="min-w-0">
          <Text variant="title" className="mb-3 text-lg">
            Needs attention
          </Text>
          {attention.length === 0 ? (
            <EmptyPanel>Nothing needs attention.</EmptyPanel>
          ) : (
            <NeedsAttentionList items={attention} payments={payments} />
          )}
        </section>

        <section className="min-w-0">
          <Text variant="title" className="mb-3 text-lg">
            Roster
          </Text>
          {roster.length === 0 ? (
            <EmptyPanel>
              No talent yet. Add a record, or invite someone onto Creator
              Assist.
            </EmptyPanel>
          ) : (
            <RosterList items={roster} />
          )}
        </section>
      </div>
    </>
  );
}
