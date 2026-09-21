"use client";

import { NeedsAttentionList } from "@/components/NeedsAttentionList";
import { PageWrapper } from "@/components/PageWrapper";
import { RosterList } from "@/components/RosterList";
import { StatCard } from "@/components/StatCard";
import { Text } from "@/components/Text";
import { AGENCY_ATTENTION } from "@/lib/talentMock";
import { useAgencyOverviewData } from "@/lib/useMockDb";
import { workspaceNav, workspaceShell } from "@/lib/workspace";

export function AgencyOverview() {
  const { stats, roster } = useAgencyOverviewData();

  return (
    <PageWrapper
      {...workspaceShell}
      navItems={workspaceNav}
      title="Overview"
      description={stats.description}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Talent"
          value={String(stats.talentCount)}
          footer={stats.talentFooter}
          tone="collab"
        />
        <StatCard
          label="Outstanding"
          value={stats.outstanding}
          footer={stats.outstandingFooter}
          tone="payment"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          footer={stats.overdueFooter}
          tone="organic"
          valueClassName="text-danger!"
        />
        <StatCard
          label="Received this month"
          value={stats.received}
          footer={stats.receivedFooter}
          tone="idea"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8">
        <section className="min-w-0">
          <Text variant="title" className="mb-3 text-lg">
            Needs attention
          </Text>
          <NeedsAttentionList items={AGENCY_ATTENTION} />
        </section>

        <section className="min-w-0">
          <Text variant="title" className="mb-3 text-lg">
            Roster
          </Text>
          <RosterList items={roster} />
        </section>
      </div>
    </PageWrapper>
  );
}
