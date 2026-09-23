"use client";

import { useState } from "react";
import { NeedsAttentionCard } from "@/components/NeedsAttentionCard";
import { PaginatedList } from "@/components/PaginatedList";
import { PaymentEditModal } from "@/components/PaymentEditModal";
import { useAgencyPayments } from "@/lib/useMockDb";

export type AttentionItem = {
  id: string;
  name: string;
  project: string;
  detail: string;
  amount: string;
  overdue?: boolean;
};

export function NeedsAttentionList({ items }: { items: AttentionItem[] }) {
  const payments = useAgencyPayments();
  const [openId, setOpenId] = useState<string | null>(null);
  const payment = payments.find((row) => row.id === openId) ?? null;

  return (
    <>
      <PaginatedList
        items={items}
        getKey={(item) => item.id}
        renderItem={(item) => (
          <NeedsAttentionCard
            name={item.name}
            project={item.project}
            detail={item.detail}
            amount={item.amount}
            overdue={item.overdue}
            onOpen={() => setOpenId(item.id)}
          />
        )}
      />
      <PaymentEditModal
        payment={payment}
        open={payment != null}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}
