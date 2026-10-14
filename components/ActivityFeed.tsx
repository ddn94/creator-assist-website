"use client";

import { useEffect, useState } from "react";
import { Text } from "@/components/Text";
import { activityWhen } from "@/lib/data/format";
import type { TalentActivityItem } from "@/lib/talent";

type ActivityFeedProps = {
  items: TalentActivityItem[];
  className?: string;
  /** Person's IANA timezone. Falls back to the browser zone after mount. */
  timeZone?: string | null;
};

export function ActivityFeed({
  items,
  className = "",
  timeZone = null,
}: ActivityFeedProps) {
  const [zone, setZone] = useState(timeZone);

  useEffect(() => {
    if (timeZone) {
      setZone(timeZone);
      return;
    }
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone || null);
  }, [timeZone]);

  return (
    <section className={className}>
      <Text variant="title" className="mb-3 text-lg lg:self-end">
        Recent changes
      </Text>
      <div className="rounded-card border border-card-border bg-card p-4 shadow-card sm:p-5 lg:self-start">
        {items.length > 0 ? (
          <ul className="space-y-3.5">
            {items.map((item) => (
              <li key={item.id}>
                <Text variant="cardTitle">{item.title}</Text>
                <Text variant="caption" className="mt-0.5" suppressHydrationWarning>
                  {item.detail
                    ? `${item.detail} · ${activityWhen(item.when, new Date(), zone)}`
                    : activityWhen(item.when, new Date(), zone)}
                </Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text variant="description">No recent changes.</Text>
        )}
      </div>
    </section>
  );
}
