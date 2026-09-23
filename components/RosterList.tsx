"use client";

import { PaginatedList } from "@/components/PaginatedList";
import { RosterCard } from "@/components/RosterCard";
import type { StatusTagTone } from "@/components/StatusTag";

export type RosterItem = {
  id?: string;
  name: string;
  platforms: string;
  status: string;
  statusTone?: StatusTagTone;
  meta: string;
};

export function RosterList({ items }: { items: RosterItem[] }) {
  return (
    <PaginatedList
      items={items}
      getKey={(item) => item.id ?? item.name}
      renderItem={(item) => <RosterCard {...item} />}
    />
  );
}
