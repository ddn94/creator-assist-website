"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormAlert } from "@/components/FormAlert";
import { showToast } from "@/components/Toast";
import { Text } from "@/components/Text";
import { respondConnectionRequestAction } from "@/lib/data/talentActions";
import type { ConnectionRequest } from "@/lib/data/talentRecords";

export function ConnectionRequests({
  requests,
  currentAgency = null,
}: {
  requests: ConnectionRequest[];
  currentAgency?: string | null;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const alreadyConnected = Boolean(currentAgency);

  async function answer(request: ConnectionRequest, accept: boolean) {
    if (pendingId) return;
    if (accept && alreadyConnected) return;
    setPendingId(request.recordId);
    setError(null);
    const result = await respondConnectionRequestAction(request.recordId, accept);
    if (result.error) {
      setError(result.error);
      setPendingId(null);
      return;
    }
    showToast(
      accept
        ? `Connected to ${request.agencyName}.`
        : `Request from ${request.agencyName} declined.`,
    );
    router.refresh();
    setPendingId(null);
  }

  if (requests.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      <Text variant="label" className="px-1">
        Connection requests
      </Text>
      {requests.map((request) => (
        <Card key={request.recordId} className="p-4 sm:p-5">
          <Text variant="title" className="text-base">
            {request.agencyName}
          </Text>
          <Text variant="description" className="mt-1">
            {currentAgency
              ? `You’re connected to ${currentAgency}. Disconnect from them before you accept. Past deals stay with ${currentAgency}. ${request.agencyName} only sees posts you add after you accept.`
              : "Wants to connect. Once you accept, they'll see the deals and content you add from then on. Anything older stays private."}
          </Text>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={alreadyConnected || pendingId === request.recordId}
              className="disabled:cursor-not-allowed"
              onClick={() => void answer(request, true)}
            >
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pendingId === request.recordId}
              onClick={() => void answer(request, false)}
            >
              Decline
            </Button>
          </div>
        </Card>
      ))}
      {error ? <FormAlert error={error} /> : null}
    </div>
  );
}
