"use client";

import { NeedsAttentionList } from "@/components/NeedsAttentionList";
import { PageWrapper } from "@/components/PageWrapper";
import { RosterList, type RosterItem } from "@/components/RosterList";
import { StatCard } from "@/components/StatCard";
import { Text } from "@/components/Text";
import { useAgencyOverviewData } from "@/lib/useMockDb";
import { workspaceNav } from "@/lib/workspace";

type AgencyOverviewProps = {
  userName: string;
  userEmail?: string;
  brand: string;
  avatarUrl?: string | null;
  description: string;
  talentCount: number;
  talentFooter: string;
  roster: RosterItem[];
};

export function AgencyOverview({
  userName,
  userEmail,
  brand,
  avatarUrl,
  description,
  talentCount,
  talentFooter,
  roster,
}: AgencyOverviewProps) {
  const { stats, attention } = useAgencyOverviewData();

  return (
    <PageWrapper
      brand={brand}
      brandMeta="Agency workspace"
      userName={userName}
      userEmail={userEmail}
      avatarUrl={avatarUrl}
      profileHref="/workspace/profile"
      navItems={workspaceNav}
      title="Overview"
      description={description}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Talent"
          value={String(talentCount)}
          footer={talentFooter}
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
          <NeedsAttentionList items={attention} />
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
