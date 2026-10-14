"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NeedsAttentionCard } from "@/components/NeedsAttentionCard";
import { showToast } from "@/components/Toast";
import { PaginatedList } from "@/components/PaginatedList";
import { PaymentEditModal } from "@/components/PaymentEditModal";
import { updateContentInvoiceAction } from "@/lib/data/actions";
import type { AttentionItem } from "@/lib/data/selectors";
import { withInvoice } from "@/lib/payments";
import type { PaymentItem } from "@/lib/payments";
import { attentionDetail, computeDueDate } from "@/lib/tracker";

export function NeedsAttentionList({
  items,
  payments,
}: {
  items: AttentionItem[];
  payments: PaymentItem[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const serverKey = items
    .map((item) => `${item.id}:${item.detail}:${item.overdue}`)
    .join("|");
  const [draft, setDraft] = useState<{
    key: string;
    rows: AttentionItem[];
  } | null>(null);
  const rows = draft?.key === serverKey ? draft.rows : items;
  const payment = payments.find((row) => row.id === openId) ?? null;

  return (
    <>
      <PaginatedList
        items={rows}
        getKey={(item) => item.id}
        renderItem={(item) => (
          <NeedsAttentionCard
            name={item.name}
            project={item.project}
            detail={item.detail}
            amount={item.amount}
            overdue={item.overdue}
            onOpen={() => {
              setSaveError(null);
              setOpenId(item.id);
            }}
          />
        )}
      />
      <PaymentEditModal
        payment={payment}
        open={payment != null}
        error={saveError}
        onClose={() => setOpenId(null)}
        onSave={(patch) => {
          if (!payment) return;
          const previous = rows;
          const next = withInvoice(payment, patch);
          const dueIso = computeDueDate({
            paymentTerms: patch.paymentTerms,
            dateInvoiced: patch.dateInvoiced || null,
          });
          const nextRows =
            next.status === "paid"
              ? rows.filter((row) => row.id !== payment.id)
              : rows.map((row) =>
                  row.id === payment.id
                    ? {
                        ...row,
                        overdue: next.status === "overdue",
                        detail:
                          attentionDetail(next.status, {
                            dueIso,
                            deliveredLabel: payment.delivered,
                          }) ?? row.detail,
                      }
                    : row,
                );
          setDraft({ key: serverKey, rows: nextRows });
          setOpenId(null);
          void updateContentInvoiceAction(payment.id, patch).then((result) => {
            if (result.error) {
              setDraft({ key: serverKey, rows: previous });
              setSaveError(result.error);
              setOpenId(payment.id);
              return;
            }
            showToast("Payment updated.");
            router.refresh();
          });
        }}
      />
    </>
  );
}
