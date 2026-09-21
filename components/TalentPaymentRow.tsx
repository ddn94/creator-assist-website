"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import {
  PAYMENT_TERM_OPTIONS,
  paymentStatusTone,
  type TalentPaymentItem,
} from "@/lib/talentPayments";

type TalentPaymentRowProps = {
  payment: TalentPaymentItem;
  onMarkPaid: (id: string) => void;
  onMarkInvoiced: (id: string, terms: string) => void;
};

function dash(value: string | null) {
  return value ?? "—";
}

export function TalentPaymentRow({
  payment,
  onMarkPaid,
  onMarkInvoiced,
}: TalentPaymentRowProps) {
  const [terms, setTerms] = useState<string>(payment.terms ?? "net_30");
  const tone = paymentStatusTone[payment.status];
  const overdue = payment.status === "overdue";

  return (
    <tr
      className={[
        "border-b border-card-border last:border-b-0",
        overdue ? "bg-organic/60" : "bg-card",
      ].join(" ")}
    >
      <td className="px-4 py-3">
        <Link
          href={`/home/tracker/${payment.contentId}`}
          className="font-display text-xs font-semibold text-ink hover:underline"
        >
          {payment.content}
        </Link>
        <Text variant="caption" className="mt-0.5 text-xs">
          {payment.platform}
        </Text>
      </td>
      <td className="px-3 py-3">
        <Text variant="caption" className="text-xs text-ink">
          {payment.brand}
        </Text>
      </td>
      <td className="px-3 py-3 text-right">
        <Text variant="caption" className="text-xs font-medium text-ink">
          {payment.fee}
        </Text>
      </td>
      <td className="px-3 py-3">
        <Text variant="caption" className="text-xs">
          {payment.deliverables}
        </Text>
      </td>
      <td className="px-3 py-3">
        <Text variant="caption" className="text-xs text-ink">
          {dash(payment.termsLabel)}
        </Text>
      </td>
      <td className="px-3 py-3">
        <Text variant="caption" className="text-xs text-ink">
          {dash(payment.delivered)}
        </Text>
      </td>
      <td className="px-3 py-3">
        <Text variant="caption" className="text-xs text-ink">
          {dash(payment.invoiced)}
        </Text>
      </td>
      <td className="px-3 py-3">
        <Text
          variant="caption"
          className={[
            "text-xs",
            overdue ? "font-semibold text-danger!" : "text-ink",
          ].join(" ")}
        >
          {dash(payment.due)}
        </Text>
      </td>
      <td className="px-3 py-3">
        <StatusTag
          label={payment.statusLabel}
          tone={tone}
          className="text-xs"
        />
      </td>
      <td className="px-3 py-3">
        <Text variant="caption" className="text-xs text-ink">
          {dash(payment.paid)}
        </Text>
      </td>
      <td className="w-0 px-2 py-2.5 whitespace-nowrap last:pr-3">
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
      </td>
    </tr>
  );
}
