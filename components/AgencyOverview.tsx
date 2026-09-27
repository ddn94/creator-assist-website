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
          <NeedsAttentionList items={attention} payments={payments} />
        </section>

        <section className="min-w-0">
          <Text variant="title" className="mb-3 text-lg">
            Roster
          </Text>
          <RosterList items={roster} />
        </section>
      </div>
    </>
  );
}
