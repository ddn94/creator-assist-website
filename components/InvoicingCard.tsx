"use client";

import { useEffect, useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { updateContentInvoice } from "@/lib/mockStore";
import type { TalentInvoicing } from "@/lib/talent";
import { PAYMENT_TERM_OPTIONS, type PaymentTerms } from "@/lib/tracker";

type InvoicingCardProps = {
  invoicing: TalentInvoicing;
  className?: string;
};

export function InvoicingCard({
  invoicing,
  className = "",
}: InvoicingCardProps) {
  const [open, setOpen] = useState(false);
  const [invoiced, setInvoiced] = useState(invoicing.dateInvoiced);
  const [terms, setTerms] = useState<PaymentTerms>(invoicing.paymentTerms);
  const [paid, setPaid] = useState(invoicing.datePaid);

  useEffect(() => {
    setInvoiced(invoicing.dateInvoiced);
    setTerms(invoicing.paymentTerms);
    setPaid(invoicing.datePaid);
  }, [invoicing]);

  function save() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiced)) return;
    if (paid && !/^\d{4}-\d{2}-\d{2}$/.test(paid)) return;
    updateContentInvoice(invoicing.contentId, {
      dateInvoiced: invoiced,
      paymentTerms: terms,
      datePaid: paid || null,
    });
  }

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
                  type="date"
                  size="sm"
                  full
                  value={invoiced}
                  onChange={(event) => setInvoiced(event.target.value)}
                />
              </label>
              <label className="block min-w-0">
                <Text variant="caption" className="mb-1.5 font-medium text-ink">
                  Payment terms
                </Text>
                <Select
                  size="sm"
                  full
                  options={[...PAYMENT_TERM_OPTIONS]}
                  value={terms}
                  onChange={(value) => setTerms(value as PaymentTerms)}
                />
              </label>
              <label className="block min-w-0">
                <Text variant="caption" className="mb-1.5 font-medium text-ink">
                  Date paid
                </Text>
                <TextField
                  type="date"
                  size="sm"
                  full
                  value={paid}
                  onChange={(event) => setPaid(event.target.value)}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <Button
                type="button"
                size="sm"
                className="w-full sm:w-auto"
                onClick={save}
                disabled={!invoiced}
              >
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
