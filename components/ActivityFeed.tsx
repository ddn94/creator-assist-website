import { Text } from "@/components/Text";
import type { TalentActivityItem } from "@/lib/talent";

type ActivityFeedProps = {
  items: TalentActivityItem[];
  className?: string;
};

export function ActivityFeed({ items, className = "" }: ActivityFeedProps) {
  return (
    <section className={className}>
      <Text variant="title" className="mb-3 text-lg">
        Recent changes
      </Text>
      <div className="rounded-card border border-card-border bg-card p-4 shadow-card sm:p-5">
        {items.length > 0 ? (
          <ul className="space-y-3.5">
            {items.map((item) => (
              <li key={item.id}>
                <Text variant="cardTitle">{item.title}</Text>
                <Text variant="caption" className="mt-0.5">
                  {item.meta}
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
