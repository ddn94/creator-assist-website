"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BackLink } from "@/components/BackLink";
import { DealTable } from "@/components/DealTable";
import { InvoicingCard } from "@/components/InvoicingCard";
import { TalentProfileHeader } from "@/components/TalentProfileHeader";
import { Text } from "@/components/Text";
import { hydrateMockDbFromSession } from "@/lib/mockStore";
import { useAgencyTalentDetail } from "@/lib/useMockDb";

type TalentDetailViewProps = {
  id: string;
};

export function TalentDetailView({ id }: TalentDetailViewProps) {
  const talent = useAgencyTalentDetail(id);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateMockDbFromSession();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <Text variant="description" className="py-8 text-center">
        Loading…
      </Text>
    );
  }

  if (!talent) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <BackLink href="/workspace/talent" label="Talent" />
        <TalentProfileHeader talent={talent} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] lg:gap-8">
        <div className="min-w-0 space-y-8">
          <DealTable deals={talent.deals} />
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
