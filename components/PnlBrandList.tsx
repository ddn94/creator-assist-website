import { Text } from "@/components/Text";
import type { PnlBrandRow } from "@/lib/pnl";

type PnlBrandListProps = {
  rows: PnlBrandRow[];
  className?: string;
};

export function PnlBrandList({
  rows,
  className = "",
}: PnlBrandListProps) {
  return (
    <section
      className={[
        "flex h-full flex-col rounded-card border border-card-border bg-card shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="border-b border-card-border px-4 py-3 sm:px-5">
        <Text variant="title" className="text-base">
          By brand
        </Text>
      </div>
      <ul className="divide-y divide-card-border">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
          >
            <Text variant="cardTitle" className="min-w-0 truncate">
              {row.name}
            </Text>
            <Text variant="caption" className="shrink-0 font-medium text-ink">
              {row.value}
            </Text>
          </li>
        ))}
      </ul>
    </section>
  );
}
