"use client";

import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import type { TalentInvoicing } from "@/lib/talent";

type InvoicingCardProps = {
  invoicing: TalentInvoicing;
  className?: string;
};

export function InvoicingCard({
  invoicing,
  className = "",
}: InvoicingCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className={className}>
      <Text variant="title" className="mb-3 text-lg">
        Invoicing
      </Text>
      <div className="rounded-card border border-card-border bg-card p-4 shadow-card sm:p-5">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <div className="min-w-0">
            <Text variant="cardTitle" className="text-base">
              {invoicing.dealTitle}
            </Text>
            <Text variant="caption" className="mt-1">
              {invoicing.summary}
            </Text>
          </div>
          <span
            className="inline-flex size-8 shrink-0 items-center justify-center text-muted"
            aria-hidden
          >
            <CaretDownIcon
              size={18}
              weight="bold"
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {open ? (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block min-w-0">
                <Text variant="caption" className="mb-1.5 font-medium text-ink">
                  Date invoiced
                </Text>
                <TextField
                  size="sm"
                  full
                  defaultValue={invoicing.dateInvoiced}
                  readOnly
                />
              </label>
              <label className="block min-w-0">
                <Text variant="caption" className="mb-1.5 font-medium text-ink">
                  Payment terms
                </Text>
                <TextField
                  size="sm"
                  full
                  defaultValue={invoicing.paymentTerms}
                  readOnly
                />
              </label>
              <label className="block min-w-0">
                <Text variant="caption" className="mb-1.5 font-medium text-ink">
                  Date paid
                </Text>
                <TextField
                  size="sm"
                  full
                  defaultValue={invoicing.datePaid}
                  readOnly
                  className="bg-background"
                />
                <Text variant="caption" className="mt-1.5">
                  {invoicing.datePaidHint}
                </Text>
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <Button type="button" size="sm" className="w-full sm:w-auto">
                Save invoicing
              </Button>
              <Text variant="caption">{invoicing.dueNote}</Text>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
