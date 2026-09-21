"use client";

import {
  useEffect,
  useId,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@phosphor-icons/react";
import { Text } from "@/components/Text";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className = "",
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={[
          "relative z-10 flex max-h-[min(92dvh,44rem)] w-full max-w-lg flex-col overflow-hidden rounded-card border border-card-border bg-card shadow-card",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex items-start justify-between gap-3 border-b border-card-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <Text id={titleId} variant="title" className="text-lg">
              {title}
            </Text>
            {description ? (
              <Text
                id={descriptionId}
                variant="caption"
                className="mt-1 leading-relaxed"
              >
                {description}
              </Text>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-background hover:text-ink"
          >
            <XIcon size={18} weight="bold" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-card-border px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
