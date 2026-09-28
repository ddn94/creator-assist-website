"use client";

import { useState } from "react";
import {
  BuildingsIcon,
  CurrencyGbpIcon,
  GlobeIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { DateField } from "@/components/DateField";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { Select } from "@/components/Select";
import { Text } from "@/components/Text";
import type { PaymentItem } from "@/lib/payments";
import { toDateInput } from "@/lib/timestamps";
import {
  PAYMENT_TERM_OPTIONS,
  type PaymentTerms,
} from "@/lib/tracker";

type InvoicePatch = {
  dateInvoiced: string;
  paymentTerms: PaymentTerms;
  datePaid: string | null;
};

type PaymentEditModalProps = {
  payment: PaymentItem | null;
  open: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (patch: InvoicePatch) => void;
};

export function PaymentEditModal({
  payment,
  open,
  error,
  onClose,
  onSave,
}: PaymentEditModalProps) {
  return (
    <PaymentEditForm
      key={
        payment
          ? `${payment.id}:${payment.dateInvoicedIso}:${payment.datePaidIso}:${payment.paymentTerms}`
          : "closed"
      }
      payment={payment}
      open={open}
      error={error}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function PaymentEditForm({
  payment,
  open,
  error,
  onClose,
  onSave,
}: PaymentEditModalProps) {
  const [invoiced, setInvoiced] = useState(
    toDateInput(payment?.dateInvoicedIso),
  );
  const [terms, setTerms] = useState<PaymentTerms>(
    payment?.paymentTerms ?? "net_30",
  );
  const [paid, setPaid] = useState(toDateInput(payment?.datePaidIso));

  if (!payment) return null;

  function save() {
    if (!payment) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiced)) return;
    if (paid && !/^\d{4}-\d{2}-\d{2}$/.test(paid)) return;
    onSave({
      dateInvoiced: invoiced,
      paymentTerms: terms,
      datePaid: paid || null,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit payment details"
      description="Update the invoice date, payment terms, and paid date for this deal."
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
        {error ? (
          <Text variant="caption" className="text-danger!">
            {error}
          </Text>
        ) : null}
        <div className="flex items-start gap-3 rounded-xl bg-background px-3 py-3">
          <Avatar name={payment.talentName ?? payment.content} size="sm" />
          <div className="min-w-0 flex-1">
            <Text variant="cardTitle">
              {payment.talentName ?? payment.content}
            </Text>
            <Text variant="caption" className="mt-0.5 truncate text-ink">
              {payment.talentName ? payment.content : payment.brand}
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
            <DateField
              id="invoice-date"
              size="sm"
              full
              value={invoiced}
              onChange={setInvoiced}
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

          <Field
            id="date-paid"
            label="Date paid"
            hint="Leave blank if the brand has not paid yet."
            className="sm:col-span-2"
          >
            <DateField
              id="date-paid"
              size="sm"
              full
              value={paid}
              onChange={setPaid}
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
            Status is calculated from the delivery date, invoice date, payment
            terms, and paid date.
          </Text>
        </div>
      </div>
    </Modal>
  );
}
