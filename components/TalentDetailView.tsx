"use client";

import { Suspense, useState } from "react";
import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BackLink } from "@/components/BackLink";
import { DealTable } from "@/components/DealTable";
import { DisconnectLink } from "@/components/DisconnectLink";
import { FormAlert } from "@/components/FormAlert";
import { InvoicingCard } from "@/components/InvoicingCard";
import { RecordContentForm } from "@/components/RecordContentForm";
import { showToast } from "@/components/Toast";
import { TalentInviteCard } from "@/components/TalentInviteCard";
import { TalentProfileHeader } from "@/components/TalentProfileHeader";
import { Text } from "@/components/Text";
import { deleteTalentRecordAction } from "@/lib/data/talentActions";
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
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDelete = talent.status === "record";
  const canDisconnect = talent.status === "active";

  async function handleDelete() {
    if (!canDelete || pending) return;
    setPending(true);
    setError(null);
    const result = await deleteTalentRecordAction(talent.id);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    showToast(`“${talent.name}” was removed.`, "danger");
    router.push(backHref);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <BackLink href={backHref} label={backLabel} />
          {canDelete ? (
            <button
              type="button"
              aria-label="Delete record"
              title="Delete"
              onClick={() => void handleDelete()}
              disabled={pending}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-card text-danger shadow-card transition-colors hover:bg-organic disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card"
            >
              <TrashIcon size={18} weight="regular" aria-hidden />
            </button>
          ) : null}
          {canDisconnect ? (
            <DisconnectLink recordId={talent.id} name={talent.name} side="agency" />
          ) : null}
        </div>
        {error ? <FormAlert error={error} /> : null}
        <TalentProfileHeader talent={talent} />
      </div>

      {talent.status === "record" ||
      talent.status === "invited" ||
      talent.status === "disconnected" ||
      talent.status === "requested" ? (
        <TalentInviteCard
          id={talent.id}
          email={recordEmail ?? talent.email}
          inviteCode={inviteCode}
          status={talent.status}
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
            <InvoicingCard
              invoicing={talent.invoicing}
              readOnly={talent.status === "disconnected"}
            />
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
