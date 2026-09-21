"use client";

import { NeedsAttentionCard } from "@/components/NeedsAttentionCard";
import { PaginatedList } from "@/components/PaginatedList";

export type AttentionItem = {
  name: string;
  project: string;
  detail: string;
  amount: string;
  overdue?: boolean;
};

export function NeedsAttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <PaginatedList
      items={items}
      getKey={(item) => `${item.name}-${item.project}`}
      renderItem={(item) => <NeedsAttentionCard {...item} />}
    />
  );
}
