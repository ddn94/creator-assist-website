"use client";

import { ActivityFeed } from "@/components/ActivityFeed";
import { BackLink } from "@/components/BackLink";
import { DealTable } from "@/components/DealTable";
import { TalentInviteCard } from "@/components/TalentInviteCard";
import { TalentProfileHeader } from "@/components/TalentProfileHeader";
import { Text } from "@/components/Text";
import type { TalentDetail } from "@/lib/talent";

type TalentDetailViewProps = {
  talent: TalentDetail;
  inviteCode?: string | null;
  recordEmail?: string | null;
};

export function TalentDetailView({
  talent,
  inviteCode = null,
  recordEmail = null,
}: TalentDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <BackLink href="/workspace/talent" label="Talent" />
        <TalentProfileHeader talent={talent} />
      </div>

      {talent.status !== "active" ? (
        <TalentInviteCard
          id={talent.id}
          email={recordEmail ?? talent.email}
          inviteCode={inviteCode}
        />
      ) : null}

      {talent.email ? (
        <Text variant="caption">{talent.email}</Text>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] lg:gap-8">
        <div className="min-w-0 space-y-8">
          <DealTable deals={talent.deals} />
        </div>

        <aside className="min-w-0">
          <ActivityFeed items={talent.activity} />
        </aside>
      </div>
    </div>
  );
}
