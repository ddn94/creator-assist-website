"use client";

import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { showToast } from "@/components/Toast";
import { DateField } from "@/components/DateField";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { updateContentInvoiceAction } from "@/lib/data/actions";
import { toDateInput } from "@/lib/timestamps";
import type { TalentInvoicing } from "@/lib/talent";
import { PAYMENT_TERM_OPTIONS, type PaymentTerms } from "@/lib/tracker";

type InvoicingCardProps = {
  items: TalentInvoicing[];
  className?: string;
  readOnly?: boolean;
};

export function InvoicingCard({
  items,
  className = "",
  readOnly = false,
}: InvoicingCardProps) {
  if (items.length === 0) return null;

  return (
    <section className={className}>
      <Text variant="title" className="mb-3 text-lg">
        Invoicing
      </Text>
      <div className="space-y-3">
        {items.map((invoicing) => (
          <InvoicingEditor
            key={`${invoicing.contentId}:${invoicing.dateInvoiced}:${invoicing.paymentTerms}:${invoicing.datePaid}:${invoicing.dueNote}`}
            invoicing={invoicing}
            readOnly={readOnly}
          />
        ))}
      </div>
    </section>
  );
}

function InvoicingEditor({
  invoicing,
  readOnly = false,
}: {
  invoicing: TalentInvoicing;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [invoiced, setInvoiced] = useState(toDateInput(invoicing.dateInvoiced));
  const [terms, setTerms] = useState<PaymentTerms>(invoicing.paymentTerms);
  const [paid, setPaid] = useState(toDateInput(invoicing.datePaid));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (readOnly) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiced)) return;
    if (paid && !/^\d{4}-\d{2}-\d{2}$/.test(paid)) return;
    setError(null);
    setSaved(true);
    const result = await updateContentInvoiceAction(invoicing.contentId, {
      dateInvoiced: invoiced,
      paymentTerms: terms,
      datePaid: paid || null,
    });
    if (result.error) {
      setSaved(false);
      setError(result.error);
      return;
    }
    showToast("Invoicing saved.");
    router.refresh();
  }

  return (
    <div className="rounded-card border border-card-border bg-card p-4 shadow-card sm:p-5">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            if (!readOnly) setOpen((prev) => !prev);
          }}
          disabled={readOnly}
          className="flex w-full cursor-pointer items-start justify-between gap-3 text-left"
        >
          <div className="min-w-0">
            <Text variant="cardTitle" className="text-base">
              {invoicing.dealTitle}
            </Text>
            <Text variant="caption" className="mt-1">
              {invoicing.summary}
            </Text>
            {open ? null : (
              <Text variant="caption" className="mt-1">
                {invoicing.dueNote}
              </Text>
            )}
          </div>
          {readOnly ? null : (
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
          )}
        </button>

        {open ? (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block min-w-0">
                <Text variant="caption" className="mb-1.5 font-medium text-ink">
                  Date invoiced
                </Text>
                <DateField
                  size="sm"
                  full
                  value={invoiced}
                  onChange={(next) => {
                    setInvoiced(next);
                    setSaved(false);
                  }}
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
                  onChange={(value) => {
                    setTerms(value as PaymentTerms);
                    setSaved(false);
                  }}
                />
              </label>
              <label className="block min-w-0">
                <Text variant="caption" className="mb-1.5 font-medium text-ink">
                  Date paid
                </Text>
                <DateField
                  size="sm"
                  full
                  value={paid}
                  onChange={(next) => {
                    setPaid(next);
                    setSaved(false);
                  }}
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
                {saved ? "Saved" : "Save invoicing"}
              </Button>
              <Text
                variant="caption"
                className={error ? "text-danger!" : undefined}
              >
                {error ?? invoicing.dueNote}
              </Text>
            </div>
          </>
        ) : null}
    </div>
  );
}
