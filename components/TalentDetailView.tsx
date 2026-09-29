"use client";

import { Suspense } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BackLink } from "@/components/BackLink";
import { DealTable } from "@/components/DealTable";
import { InvoicingCard } from "@/components/InvoicingCard";
import { RecordContentForm } from "@/components/RecordContentForm";
import { TalentInviteCard } from "@/components/TalentInviteCard";
import { TalentProfileHeader } from "@/components/TalentProfileHeader";
import { Text } from "@/components/Text";
import type { TalentDetail } from "@/lib/talent";

type TalentDetailViewProps = {
  talent: TalentDetail;
  inviteCode?: string | null;
  recordEmail?: string | null;
  backHref?: string;
  backLabel?: string;
  fromOverview?: boolean;
  canAddContent?: boolean;
  platformOptions?: { value: string; label: string }[];
};

export function TalentDetailView({
  talent,
  inviteCode = null,
  recordEmail = null,
  backHref = "/workspace/talent",
  backLabel = "Talent",
  fromOverview = false,
  canAddContent = false,
  platformOptions = [],
}: TalentDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <BackLink href={backHref} label={backLabel} />
        <TalentProfileHeader talent={talent} />
      </div>

      {talent.status !== "active" ? (
        <TalentInviteCard
          id={talent.id}
          email={recordEmail ?? talent.email}
          inviteCode={inviteCode}
        />
      ) : null}

      {canAddContent ? (
        <Suspense fallback={null}>
          <RecordContentForm
            recordId={talent.id}
            platformOptions={platformOptions}
          />
        </Suspense>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] lg:gap-8">
        <div className="min-w-0 space-y-8">
          <DealTable
            deals={talent.deals}
            talentId={talent.id}
            fromOverview={fromOverview}
          />
          {talent.invoicing ? (
            <InvoicingCard invoicing={talent.invoicing} />
          ) : null}
          {talent.deals.length === 0 && !talent.invoicing ? (
            <Text variant="description">No deals yet for this talent.</Text>
          ) : null}
        </div>

        <aside className="min-w-0">
          <ActivityFeed items={talent.activity} />
        </aside>
      </div>
    </div>
  );
}
