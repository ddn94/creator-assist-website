"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormAlert } from "@/components/FormAlert";
import { SettingsRow } from "@/components/SettingsRow";
import { showToast } from "@/components/Toast";
import { disconnectTalentLinkAction } from "@/lib/data/talentActions";

type DisconnectLinkProps = {
  recordId: string;
  name: string;
  side: "talent" | "agency";
};

export function DisconnectLink({ recordId, name, side }: DisconnectLinkProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (pending) return;
    const message =
      side === "talent"
        ? `Disconnect from ${name}? They keep deals from before today. Anything you add after this stays private.`
        : `Disconnect ${name}? You keep deals from before today. Anything they add after this stays private.`;
    if (!window.confirm(message)) return;
    setPending(true);
    setError(null);
    const result = await disconnectTalentLinkAction(recordId);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    showToast(
      side === "talent"
        ? `Disconnected from ${name}.`
        : `${name} was disconnected.`,
    );
    router.refresh();
    setPending(false);
  }

  if (side === "agency") {
    return (
      <div className="text-right">
        <button
          type="button"
          onClick={() => void onClick()}
          disabled={pending}
          className="cursor-pointer font-sans text-sm font-medium text-danger disabled:opacity-40"
        >
          {pending ? "Disconnecting…" : "Disconnect"}
        </button>
        {error ? (
          <div className="mt-2">
            <FormAlert error={error} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SettingsRow
        title={pending ? "Disconnecting…" : `Disconnect from ${name}`}
        description="They keep deals from before today. New content stays private."
        danger
        onClick={() => void onClick()}
      />
      {error ? <FormAlert error={error} /> : null}
    </div>
  );
}
