import { DealRow } from "@/components/DealRow";
import { Text } from "@/components/Text";
import type { TalentDeal } from "@/lib/talent";

type DealTableProps = {
  deals: TalentDeal[];
  className?: string;
};

const COLUMNS =
  "grid-cols-[minmax(10rem,1.6fr)_minmax(6rem,1fr)_6.5rem_4.5rem_5.5rem_5.5rem]";

export function DealTable({ deals, className = "" }: DealTableProps) {
  return (
    <section className={className}>
      <Text variant="title" className="mb-3 text-lg">
        Deals
      </Text>
      <div className="overflow-hidden rounded-card border border-card-border bg-card shadow-card">
        <div
          className={`hidden gap-3 border-b border-card-border bg-background/70 px-4 py-3 md:grid ${COLUMNS}`}
        >
          {["Content", "Brand", "Platform", "Fee", "Stage", "Payment"].map(
            (label) => (
              <Text key={label} variant="caption" className="truncate">
                {label}
              </Text>
            ),
          )}
        </div>
        {deals.length > 0 ? (
          deals.map((deal) => <DealRow key={deal.id} deal={deal} />)
        ) : (
          <div className="px-4 py-8 text-center">
            <Text variant="description">No deals yet.</Text>
          </div>
        )}
      </div>
    </section>
  );
}
