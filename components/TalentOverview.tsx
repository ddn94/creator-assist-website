"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { CategoryCard } from "@/components/CategoryCard";
import { CategoryPill } from "@/components/CategoryPill";
import { StatCard } from "@/components/StatCard";
import { Text } from "@/components/Text";
import { JUMP_TILES, greeting } from "@/lib/home";
import { useTalentOverviewData } from "@/lib/useMockDb";

type TalentOverviewProps = {
  userName: string;
  avatarUrl?: string | null;
};

export function TalentOverview({ userName, avatarUrl }: TalentOverviewProps) {
  const { stats, feed } = useTalentOverviewData();
  const displayName = userName.trim() || "there";
  const firstName = displayName.split(/\s+/)[0] || displayName;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3.5">
        <Avatar name={displayName} size="lg" src={avatarUrl} />
        <div className="min-w-0">
          <Text variant="heading" className="truncate text-2xl md:text-3xl">
            {greeting()}, {firstName}
          </Text>
          <Text variant="caption" className="mt-0.5 text-sm">
            {stats.inProgress} in progress · {stats.paymentsDue} payments due
          </Text>
        </div>
      </div>

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
