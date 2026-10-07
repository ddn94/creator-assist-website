"use client";

import { CircleNotchIcon } from "@phosphor-icons/react";
import { Button } from "@/components/Button";
import { FormAlert } from "@/components/FormAlert";
import { Modal } from "@/components/Modal";
import { Text } from "@/components/Text";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  question: string;
  detail?: string;
  confirmLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  open,
  title,
  question,
  detail,
  confirmLabel,
  pendingLabel,
  pending = false,
  error = null,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!pending) onClose();
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
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="w-full bg-danger hover:bg-danger sm:w-auto"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? (
              <CircleNotchIcon size={16} className="animate-spin" aria-hidden />
            ) : null}
            {pending ? pendingLabel ?? confirmLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <Text variant="body" className="text-sm">
        {question}
      </Text>
      {detail ? (
        <Text variant="caption" className="mt-2 leading-relaxed">
          {detail}
        </Text>
      ) : null}
      {error ? (
        <div className="mt-3">
          <FormAlert error={error} />
        </div>
      ) : null}
    </Modal>
  );
}
