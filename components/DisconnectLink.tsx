"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { FormAlert } from "@/components/FormAlert";
import { Modal } from "@/components/Modal";
import { SettingsRow } from "@/components/SettingsRow";
import { Text } from "@/components/Text";
import { showToast } from "@/components/Toast";
import { disconnectTalentLinkAction } from "@/lib/data/talentActions";

type DisconnectLinkProps = {
  recordId: string;
  name: string;
  side: "talent" | "agency";
};

export function DisconnectLink({ recordId, name, side }: DisconnectLinkProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const talent = side === "talent";
  const title = talent ? `Disconnect from ${name}` : `Disconnect ${name}`;
  const question = talent
    ? `Are you sure you want to disconnect from ${name}?`
    : `Are you sure you want to disconnect ${name}?`;
  const detail = talent
    ? `Past deals stay with ${name}. A new agency does not see them. Anything you add after this is private until you connect with someone else.`
    : "Past deals stay shared. Anything they add after disconnecting is private.";

  function ask() {
    if (pending) return;
    setError(null);
    setOpen(true);
  }

  async function confirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await disconnectTalentLinkAction(recordId);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    setOpen(false);
    showToast(talent ? `Disconnected from ${name}.` : `${name} was disconnected.`);
    router.refresh();
    setPending(false);
  }

  const dialog = (
    <Modal
      open={open}
      onClose={() => {
        if (!pending) setOpen(false);
      }}
      title={title}
      footer={
        <>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="w-full bg-danger hover:bg-danger sm:w-auto"
            disabled={pending}
            onClick={() => void confirm()}
          >
            {pending ? "Disconnecting…" : "Disconnect"}
          </Button>
        </>
      }
    >
      <Text variant="body" className="text-sm">
        {question}
      </Text>
      <Text variant="caption" className="mt-2 leading-relaxed">
        {detail}
      </Text>
      {error ? (
        <div className="mt-3">
          <FormAlert error={error} />
        </div>
      ) : null}
    </Modal>
  );

  if (side === "agency") {
    return (
      <div className="text-right">
        <button
          type="button"
          onClick={ask}
          disabled={pending}
          className="cursor-pointer font-sans text-sm font-medium text-danger disabled:opacity-40"
        >
          Disconnect
        </button>
        {dialog}
      </div>
    );
  }

  return (
    <>
      <SettingsRow
        title={`Disconnect from ${name}`}
        description="Past deals stay with them. A new agency does not see them."
        danger
        onClick={ask}
      />
      {dialog}
    </>
  );
}
