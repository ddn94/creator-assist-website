"use client";

import { Suspense, useState } from "react";
import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BackLink } from "@/components/BackLink";
import { ConfirmModal } from "@/components/ConfirmModal";
import { DealTable } from "@/components/DealTable";
import { DisconnectLink } from "@/components/DisconnectLink";
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
  declinedAt?: string | null;
  recordEmail?: string | null;
  backHref?: string;
  backLabel?: string;
  fromOverview?: boolean;
  canAddContent?: boolean;
  joined?: boolean;
  platformOptions?: { value: string; label: string }[];
  timeZone?: string | null;
};

export function TalentDetailView({
  talent,
  inviteCode = null,
  declinedAt = null,
  recordEmail = null,
  backHref = "/workspace/talent",
  backLabel = "Talent",
  fromOverview = false,
  canAddContent = false,
  joined = false,
  platformOptions = [],
  timeZone = null,
}: TalentDetailViewProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDelete =
    !joined &&
    (talent.status === "record" ||
      talent.status === "invited" ||
      talent.status === "requested");
  const canDisconnect = talent.status === "active";

  function askDelete() {
    if (!canDelete || pending) return;
    setError(null);
    setConfirming(true);
  }

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
    setConfirming(false);
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
              onClick={askDelete}
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
        <TalentProfileHeader talent={talent} />
        <ConfirmModal
          open={canDelete && confirming}
          title={`Remove ${talent.name}`}
          question={`Are you sure you want to remove ${talent.name}?`}
          detail={
            talent.status === "invited"
              ? "This cancels the invite code and deletes this card and every deal logged on it."
              : talent.status === "requested"
                ? "This cancels the connection request and deletes this card and every deal logged on it."
                : "This deletes the private card and every deal logged on it."
          }
          confirmLabel="Remove"
          pendingLabel="Removing…"
          pending={pending}
          error={error}
          onClose={() => setConfirming(false)}
          onConfirm={() => void handleDelete()}
        />
      </div>

      {talent.status === "record" ||
        talent.status === "invited" ||
        talent.status === "disconnected" ||
        talent.status === "requested" ? (
        <TalentInviteCard
          id={talent.id}
          email={recordEmail ?? talent.email}
          inviteCode={inviteCode}
          declinedAt={declinedAt}
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
          {talent.invoicing.length > 0 ? (
            <InvoicingCard
              items={talent.invoicing}
              readOnly={talent.status === "disconnected"}
              timeZone={timeZone}
            />
          ) : null}
        </div>

        <aside className="min-w-0">
          <ActivityFeed items={talent.activity} timeZone={timeZone} />
        </aside>
      </div>

      {talent.status === "active" ? (
        <Text variant="caption">
          {talent.firstName} adds new deals from their side. You can still edit
          the ones you&apos;ve logged.
        </Text>
      ) : talent.status === "requested" ? (
        <Text variant="caption">
          You can still edit deals you&apos;ve logged. New ones unlock once they
          accept.
        </Text>
      ) : talent.status === "invited" ? (
        <Text variant="caption">
          Note: You can still edit deals you already logged. You can&apos;t add
          another while this invite is out.
        </Text>
      ) : null}
    </div>
  );
}
