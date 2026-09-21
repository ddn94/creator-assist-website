"use client";

import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react";
import { Avatar } from "@/components/Avatar";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import { talentStatusTone, type TalentItem } from "@/lib/talent";

type TalentRowProps = {
  talent: TalentItem;
  className?: string;
};

function dash(value: string | null) {
  return value ?? "—";
}

export function TalentRow({ talent, className = "" }: TalentRowProps) {
  const tone = talentStatusTone[talent.status];
  const href = `/workspace/talent/${talent.id}`;

  return (
    <div
      className={[
        "border-b border-card-border last:border-b-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Mobile card */}
      <Link
        href={href}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-background/60 lg:hidden"
      >
        <Avatar name={talent.name} size="sm" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Text variant="cardTitle" className="truncate">
                {talent.name}
              </Text>
              <Text variant="caption" className="mt-0.5 truncate">
                {talent.email ?? "—"}
              </Text>
            </div>
            <StatusTag label={talent.statusLabel} tone={tone} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Text variant="caption">{talent.platforms}</Text>
            <Text variant="caption">{talent.community}</Text>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Text variant="caption">
              {talent.liveDeals != null
                ? `${talent.liveDeals} live · ${dash(talent.outstanding)}`
                : dash(talent.outstanding)}
            </Text>
            <Text variant="caption">{talent.lastActivity}</Text>
          </div>
        </div>
        <CaretRightIcon
          size={16}
          weight="bold"
          className="mt-1 shrink-0 text-muted"
          aria-hidden
        />
      </Link>

      {/* Desktop row */}
      <Link
        href={href}
        className="hidden w-full grid-cols-[minmax(12rem,1.6fr)_7.5rem_minmax(6rem,1fr)_4.5rem_4.5rem_5.5rem_minmax(6rem,1fr)_1.5rem] items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-background/60 lg:grid"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={talent.name} size="sm" />
          <div className="min-w-0">
            <Text variant="cardTitle" className="truncate">
              {talent.name}
            </Text>
            <Text variant="caption" className="mt-0.5 truncate">
              {talent.email ?? "—"}
            </Text>
          </div>
        </div>
        <div>
          <StatusTag label={talent.statusLabel} tone={tone} />
        </div>
        <Text variant="caption" className="truncate text-ink">
          {talent.platforms}
        </Text>
        <Text variant="caption" className="text-ink">
          {talent.community}
        </Text>
        <Text variant="caption" className="text-ink">
          {dash(talent.liveDeals)}
        </Text>
        <Text variant="caption" className="text-ink">
          {dash(talent.outstanding)}
        </Text>
        <Text variant="caption" className="truncate text-ink">
          {talent.lastActivity}
        </Text>
        <CaretRightIcon
          size={14}
          weight="bold"
          className="justify-self-end text-muted"
          aria-hidden
        />
      </Link>
    </div>
  );
}
