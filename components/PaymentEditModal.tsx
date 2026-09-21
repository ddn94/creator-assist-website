"use client";

import { useEffect, useState } from "react";
import {
  BuildingsIcon,
  CalendarBlankIcon,
  CurrencyGbpIcon,
  GlobeIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { updateContentInvoice } from "@/lib/mockStore";
import type { PaymentItem } from "@/lib/payments";
import {
  PAYMENT_TERM_OPTIONS,
  type PaymentTerms,
} from "@/lib/tracker";

type PaymentEditModalProps = {
  payment: PaymentItem | null;
  open: boolean;
  onClose: () => void;
};

export function PaymentEditModal({
  payment,
  open,
  onClose,
}: PaymentEditModalProps) {
  const [invoiced, setInvoiced] = useState("");
  const [terms, setTerms] = useState<PaymentTerms>("net_30");

  useEffect(() => {
    if (!payment || !open) return;
    setInvoiced(payment.dateInvoicedIso ?? "");
    setTerms(
      (payment.paymentTerms as PaymentTerms | null) ?? "net_30",
    );
  }, [payment, open]);

  if (!payment) return null;

  function save() {
    if (!payment) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiced)) return;
    updateContentInvoice(payment.id, {
      dateInvoiced: invoiced,
      paymentTerms: terms,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit payment details"
      description="Update the invoice date and payment terms for this deal."
      footer={
        <>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            className="w-full whitespace-nowrap sm:w-auto"
            onClick={save}
            disabled={!invoiced}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-background px-3 py-3">
          <Avatar name={payment.talentName} size="sm" />
          <div className="min-w-0 flex-1">
            <Text variant="cardTitle">{payment.talentName}</Text>
            <Text variant="caption" className="mt-0.5 truncate text-ink">
              {payment.content}
            </Text>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="inline-flex items-center gap-1 text-muted">
                <BuildingsIcon size={14} weight="bold" aria-hidden />
                <Text as="span" variant="caption">
                  {payment.brand}
                </Text>
              </span>
              <span className="inline-flex items-center gap-1 text-muted">
                <GlobeIcon size={14} weight="bold" aria-hidden />
                <Text as="span" variant="caption">
                  {payment.platform}
                </Text>
              </span>
              <span className="inline-flex items-center gap-1 text-muted">
                <CurrencyGbpIcon size={14} weight="bold" aria-hidden />
                <Text as="span" variant="caption">
                  {payment.fee}
                </Text>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="invoice-date"
            label="Invoice date"
            hint="The date the invoice was issued to the brand."
          >
            <TextField
              id="invoice-date"
              type="date"
              size="sm"
              full
              value={invoiced}
              onChange={(event) => setInvoiced(event.target.value)}
              iconLeft={<CalendarBlankIcon size={16} weight="bold" />}
            />
          </Field>

          <Field
            id="payment-terms"
            label="Payment terms"
            hint="How long the brand has to pay the invoice."
          >
            <Select
              id="payment-terms"
              size="sm"
              full
              options={[...PAYMENT_TERM_OPTIONS]}
              value={terms}
              onChange={(value) => setTerms(value as PaymentTerms)}
              placeholder="Select terms"
            />
          </Field>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-payment px-3 py-2.5">
          <InfoIcon
            size={16}
            weight="bold"
            className="mt-0.5 shrink-0 text-payment-pill"
            aria-hidden
          />
          <Text variant="caption" className="leading-relaxed text-ink">
            Status is calculated from delivery date, invoice date and payment
            terms.
          </Text>
        </div>
      </div>
    </Modal>
  );
}
