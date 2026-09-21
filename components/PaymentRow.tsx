"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { PaymentEditModal } from "@/components/PaymentEditModal";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import { paymentStatusTone, type PaymentItem } from "@/lib/payments";

type PaymentRowProps = {
  payment: PaymentItem;
};

function dash(value: string | null) {
  return value ?? "—";
}

export function PaymentRow({ payment }: PaymentRowProps) {
  const [open, setOpen] = useState(false);
  const tone = paymentStatusTone[payment.status];
  const overdue = payment.status === "overdue";

  function openEditor(event?: MouseEvent) {
    event?.stopPropagation();
    setOpen(true);
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  const action =
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
    );

  return (
    <>
      <tr
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={onRowKeyDown}
        className={[
          "cursor-pointer border-b border-card-border last:border-b-0 transition-colors hover:bg-background/50",
          overdue ? "bg-organic" : "bg-card",
        ].join(" ")}
      >
        <td className="px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={payment.talentName} size="sm" />
            <Text variant="cardTitle" className="truncate">
              {payment.talentName}
            </Text>
          </div>
        </td>
        <td className="px-3 py-3">
          <Text variant="caption" className="truncate text-ink">
            {payment.content}
          </Text>
        </td>
        <td className="px-3 py-3">
          <Text variant="caption" className="truncate text-ink">
            {payment.brand}
          </Text>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <Text variant="caption" className="text-ink">
            {payment.fee}
          </Text>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <Text variant="caption" className="text-ink">
            {dash(payment.terms)}
          </Text>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <Text variant="caption" className="text-ink">
            {dash(payment.delivered)}
          </Text>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <Text variant="caption" className="text-ink">
            {dash(payment.invoiced)}
          </Text>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <Text
            variant="caption"
            className={overdue ? "font-medium text-danger!" : "text-ink"}
          >
            {dash(payment.due)}
          </Text>
        </td>
        <td className="px-3 py-3">
          <StatusTag label={payment.statusLabel} tone={tone} />
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <Text
            variant="caption"
            className="text-ink"
            title={
              payment.paid
                ? "Confirmed by talent"
                : "Paid is ticked by the talent when money lands"
            }
          >
            {dash(payment.paid)}
          </Text>
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap">{action}</td>
      </tr>

      <PaymentEditModal
        payment={payment}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
