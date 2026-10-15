"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { FormAlert } from "@/components/FormAlert";
import { Modal } from "@/components/Modal";
import { SettingsRow } from "@/components/SettingsRow";
import { Text } from "@/components/Text";
import { deleteOwnAccount } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/auth/types";

type DeleteAccountLinkProps = {
  role: UserRole;
};

export function DeleteAccountLink({ role }: DeleteAccountLinkProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const agency = role === "agency";
  const detail = agency
    ? "Your workspace and roster are removed. Creators keep their accounts, and any deals already on their side — including ones you logged that they claimed — plus the recent-change history on those deals."
    : "Your account, content, ideas, and photo are removed. If you work with an agency, they keep a copy of the deals you did together — marked as yours, not as theirs.";

  function ask() {
    if (pending) return;
    setError(null);
    setOpen(true);
  }

  async function confirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await deleteOwnAccount();
      if (result?.error) {
        setError(result.error);
        setPending(false);
      }
    } catch {
      // Successful delete redirects; Next surfaces that as a throw.
    }
  }

  return (
    <>
      <SettingsRow
        title="Delete account"
        description={
          agency
            ? "Permanently remove this agency workspace and its data"
            : "Permanently remove your account and your data"
        }
        danger
        onClick={ask}
      />
      <Modal
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        title="Delete account?"
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
              {pending ? "Deleting…" : "Delete account"}
            </Button>
          </>
        }
      >
        <Text variant="body" className="text-sm">
          This cannot be undone.
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
    </>
  );
}
