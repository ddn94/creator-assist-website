"use client";

import Link from "next/link";
import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { PaymentEditModal } from "@/components/PaymentEditModal";
import { Select } from "@/components/Select";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import { updateContentInvoiceAction } from "@/lib/data/actions";
import { withInvoice } from "@/lib/payments";
import {
  paymentStatusTone,
  type PaymentItem,
  type PaymentMode,
} from "@/lib/payments";
import { PAYMENT_TERM_OPTIONS } from "@/lib/tracker";

type PaymentRowProps = {
  mode: PaymentMode;
  payment: PaymentItem;
  onReplace: (payment: PaymentItem) => void;
  onMarkPaid: (id: string) => void;
  onMarkInvoiced: (id: string, terms: string) => void;
};

function dash(value: string | null) {
  return value ?? "—";
}

export function PaymentRow({
  mode,
  payment,
  onReplace,
  onMarkPaid,
  onMarkInvoiced,
}: PaymentRowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [terms, setTerms] = useState<string>(payment.paymentTerms ?? "net_30");
  const tone = paymentStatusTone[payment.status];
  const overdue = payment.status === "overdue";
  const agency = mode === "agency";

  function openEditor(event?: MouseEvent) {
    event?.stopPropagation();
    setSaveError(null);
    setOpen(true);
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (!agency) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  const contentCell = payment.contentHref ? (
    <>
      <Link
        href={payment.contentHref}
        className="font-display text-xs font-semibold text-ink hover:underline"
      >
        {payment.content}
      </Link>
      <Text variant="caption" className="mt-0.5 text-xs">
        {payment.platform}
      </Text>
    </>
  ) : (
    <Text variant="caption" className="truncate text-ink">
      {payment.content}
    </Text>
  );

  const actionCell = agency ? (
    payment.action === "setInvoice" ? (
      <Button
        type="button"
        size="xs"
        variant="primary"
        className="whitespace-nowrap"
        onClick={openEditor}
      >
        Set invoice date
      </Button>
    ) : (
      <Button
        type="button"
        variant="link"
        className="text-xs text-muted no-underline hover:text-ink"
        onClick={openEditor}
      >
        Edit
      </Button>
    )
  ) : (
    <>
      {payment.action === "markInvoiced" ? (
        <div className="flex items-center gap-1">
          <Select
            name={`terms-desk-${payment.id}`}
            value={terms}
            onChange={setTerms}
            options={[...PAYMENT_TERM_OPTIONS]}
            size="sm"
            className="w-[5.25rem] px-2"
          />
          <Button
            type="button"
            size="xs"
            className="px-2.5! py-1! whitespace-nowrap"
            onClick={() => onMarkInvoiced(payment.id, terms)}
          >
            Mark invoiced
          </Button>
        </div>
      ) : null}
      {payment.action === "markPaid" ? (
        <Button
          type="button"
          size="xs"
          className="px-2.5! py-1! whitespace-nowrap"
          onClick={() => onMarkPaid(payment.id)}
        >
          Mark paid
        </Button>
      ) : null}
      {payment.action === "done" ? (
        <Text variant="caption" className="text-xs whitespace-nowrap">
          ✓ Done
        </Text>
      ) : null}
    </>
  );

  return (
    <>
      <tr
        tabIndex={agency ? 0 : undefined}
        onClick={agency ? () => setOpen(true) : undefined}
        onKeyDown={onRowKeyDown}
        className={[
          "border-b border-card-border last:border-b-0",
          agency
            ? "cursor-pointer transition-colors hover:bg-background/50"
            : "",
          overdue ? (agency ? "bg-organic" : "bg-organic/60") : "bg-card",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {agency && payment.talentName ? (
          <td className="px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={payment.talentName} size="sm" />
              <Text variant="cardTitle" className="truncate">
                {payment.talentName}
              </Text>
            </div>
          </td>
        ) : null}
        <td className="px-4 py-3">{contentCell}</td>
        <td className="px-3 py-3">
          <Text
            variant="caption"
            className={["truncate text-ink", agency ? "" : "text-xs"]
              .filter(Boolean)
              .join(" ")}
          >
            {payment.brand}
          </Text>
        </td>
        <td
          className={[
            "px-3 py-3 whitespace-nowrap",
            agency ? "" : "text-right",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Text
            variant="caption"
            className={["text-ink", agency ? "" : "text-xs font-medium"]
              .filter(Boolean)
              .join(" ")}
          >
            {payment.fee}
          </Text>
        </td>
        {!agency ? (
          <td className="px-3 py-3">
            <Text variant="caption" className="text-xs">
              {payment.deliverables}
            </Text>
          </td>
        ) : null}
        <td className="px-3 py-3 whitespace-nowrap">
          <Text
            variant="caption"
            className={["text-ink", agency ? "" : "text-xs"]
              .filter(Boolean)
              .join(" ")}
          >
            {dash(payment.termsLabel)}
          </Text>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <Text
            variant="caption"
            className={["text-ink", agency ? "" : "text-xs"]
              .filter(Boolean)
              .join(" ")}
          >
            {dash(payment.delivered)}
          </Text>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <Text
            variant="caption"
            className={["text-ink", agency ? "" : "text-xs"]
              .filter(Boolean)
              .join(" ")}
          >
            {dash(payment.invoiced)}
          </Text>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <Text
            variant="caption"
            className={[
              agency ? "" : "text-xs",
              overdue
                ? agency
                  ? "font-medium text-danger!"
                  : "font-semibold text-danger!"
                : "text-ink",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {dash(payment.due)}
          </Text>
        </td>
        <td className="px-3 py-3">
          <StatusTag
            label={payment.statusLabel}
            tone={tone}
            className={agency ? undefined : "text-xs"}
          />
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <Text
            variant="caption"
            className={["text-ink", agency ? "" : "text-xs"]
              .filter(Boolean)
              .join(" ")}
            title={
              agency
                ? payment.paid
                  ? "Confirmed by talent"
                  : "Paid is ticked by the talent when money lands"
                : undefined
            }
          >
            {dash(payment.paid)}
          </Text>
        </td>
        <td
          className={[
            "whitespace-nowrap",
            agency ? "px-4 py-3 text-right" : "w-0 px-2 py-2.5 last:pr-3",
          ].join(" ")}
        >
          {actionCell}
        </td>
      </tr>

      {agency ? (
        <PaymentEditModal
          payment={payment}
          open={open}
          error={saveError}
          onClose={() => setOpen(false)}
          onSave={(patch) => {
            const previous = payment;
            onReplace(withInvoice(payment, patch));
            setOpen(false);
            void updateContentInvoiceAction(payment.id, patch).then((result) => {
              if (result.error) {
                onReplace(previous);
                setSaveError(result.error);
                setOpen(true);
                return;
              }
              router.refresh();
            });
          }}
        />
      ) : null}
    </>
  );
}
