"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { CategoryCard } from "@/components/CategoryCard";
import { Select } from "@/components/Select";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import {
  PAYMENT_TERM_OPTIONS,
  paymentStatusTone,
  type TalentPaymentItem,
} from "@/lib/talentPayments";

type TalentPaymentCardProps = {
  payment: TalentPaymentItem;
  onMarkPaid: (id: string) => void;
  onMarkInvoiced: (id: string, terms: string) => void;
};

export function TalentPaymentCard({
  payment,
  onMarkPaid,
  onMarkInvoiced,
}: TalentPaymentCardProps) {
  const [terms, setTerms] = useState<string>(payment.terms ?? "net_30");
  const tone = paymentStatusTone[payment.status];
  const overdue = payment.status === "overdue";

  return (
    <CategoryCard category="payment" className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/home/tracker/${payment.contentId}?section=deal&from=payments`}
          className="min-w-0 font-display text-base font-bold leading-snug text-ink hover:underline"
        >
          {payment.content}
        </Link>
        <StatusTag label={payment.statusLabel} tone={tone} />
      </div>
      <Text variant="caption" className="mt-0.5 text-sm">
        {payment.brand} · {payment.platform}
      </Text>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <Text variant="stat" className="text-2xl leading-none">
          {payment.fee}
        </Text>
        <Text
          variant="caption"
          className={[
            "mb-0.5 text-sm",
            overdue ? "font-semibold text-danger!" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {payment.due
            ? `Due ${payment.due}`
            : `${payment.termsLabel ?? "Terms TBD"} · not invoiced`}
        </Text>
      </div>
      <Text variant="caption" className="mt-1">
        {payment.deliverables}
        {payment.paid ? ` · Paid ${payment.paid}` : ""}
      </Text>

      {payment.action === "markInvoiced" ? (
        <div className="mt-3 flex items-center gap-2">
          <Select
            name={`terms-${payment.id}`}
            value={terms}
            onChange={setTerms}
            options={[...PAYMENT_TERM_OPTIONS]}
            size="sm"
            full
          />
          <Button
            type="button"
            size="sm"
            className="h-10 shrink-0 whitespace-nowrap"
            onClick={() => onMarkInvoiced(payment.id, terms)}
          >
            Mark invoiced
          </Button>
        </div>
      ) : null}
      {payment.action === "markPaid" ? (
        <Button
          type="button"
          size="sm"
          full
          className="mt-3 h-10"
          onClick={() => onMarkPaid(payment.id)}
        >
          Mark paid
        </Button>
      ) : null}
    </CategoryCard>
  );
}
