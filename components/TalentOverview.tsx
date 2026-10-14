"use client";

import Link from "next/link";
import { LinkSimpleIcon } from "@phosphor-icons/react";
import { Avatar } from "@/components/Avatar";
import { CategoryCard } from "@/components/CategoryCard";
import { ConnectionRequests } from "@/components/ConnectionRequests";
import { CategoryPill } from "@/components/CategoryPill";
import { StatCard } from "@/components/StatCard";
import { Text } from "@/components/Text";
import type {
  ContinueFeedItem,
  OverviewStats,
} from "@/lib/data/selectors";
import type { ConnectionRequest } from "@/lib/data/talentRecords";
import { JUMP_TILES, greeting } from "@/lib/home";

type TalentOverviewProps = {
  userName: string;
  avatarUrl?: string | null;
  stats: OverviewStats;
  feed: ContinueFeedItem[];
  agencyName?: string | null;
  connectionRequests?: ConnectionRequest[];
};

export function TalentOverview({
  userName,
  avatarUrl,
  stats,
  feed,
  agencyName,
  connectionRequests = [],
}: TalentOverviewProps) {
  const displayName = userName.trim() || "there";
  const firstName = displayName.split(/\s+/)[0] || displayName;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3.5">
        <div className="flex min-w-0 items-center gap-3.5 sm:flex-1">
          <Avatar name={displayName} size="lg" src={avatarUrl} />
          <div className="min-w-0">
            <Text
              variant="heading"
              className="text-2xl! leading-tight text-balance md:truncate md:text-3xl!"
            >
              {greeting()}, {firstName}
            </Text>
            <Text variant="caption" className="mt-0.5 text-sm! leading-snug">
              {stats.inProgress} in progress · {stats.paymentsDue} payments due
            </Text>
          </div>
        </div>
        {agencyName ? (
          <div className="flex w-fit max-w-full items-center gap-2 rounded-full bg-collab px-3.5 py-2.5 sm:max-w-sm sm:shrink-0 sm:py-3">
            <LinkSimpleIcon
              size={16}
              weight="bold"
              className="shrink-0 text-primary"
              aria-hidden
            />
            <Text as="span" variant="caption" className="min-w-0 text-sm! leading-snug sm:truncate">
              Connected with{" "}
              <span className="font-medium text-ink">{agencyName}</span>
            </Text>
          </div>
        ) : null}
      </div>

      <ConnectionRequests
        requests={connectionRequests}
        currentAgency={agencyName}
      />

      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label="Revenue (paid)" value={stats.revenue} tone="collab" />
        <StatCard
          label="Due this week"
          value={stats.dueThisWeek}
          tone="payment"
        />
      </div>

      <Text variant="title" className="mb-3 text-xl">
        Jump to
      </Text>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {JUMP_TILES.map((tile) => (
          <Link key={tile.href} href={tile.href} className="block">
            <CategoryCard
              category={tile.category}
              className="flex items-center justify-center py-6 font-display text-sm font-bold transition-opacity hover:opacity-80 md:text-base"
            >
              {tile.label}
            </CategoryCard>
          </Link>
        ))}
      </div>

      <Text variant="title" className="mb-3 text-xl">
        Continue creating
      </Text>
      <div className="space-y-3">
        {feed.map((item) => (
          <Link key={item.id} href={item.href} className="block">
            <CategoryCard
              category={item.category}
              className="p-4 transition-opacity hover:opacity-90"
            >
              <CategoryPill category={item.category}>{item.pill}</CategoryPill>
              <Text variant="cardTitle" className="mt-2.5 text-base">
                {item.title}
              </Text>
              <Text variant="caption" className="mt-0.5 text-sm">
                {item.meta}
              </Text>
            </CategoryCard>
          </Link>
        ))}
        {feed.length === 0 ? (
          <Text variant="caption" className="py-8 text-center text-sm">
            Nothing yet — add your first piece of content or jot down an idea.
          </Text>
        ) : null}
      </div>
    </div>
  );
}
