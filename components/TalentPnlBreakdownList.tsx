import { Text } from "@/components/Text";
import { fmtMoney, type TalentPnlBreakdownRow } from "@/lib/talentPnl";

type TalentPnlBreakdownListProps = {
  title: string;
  rows: TalentPnlBreakdownRow[];
  className?: string;
};

export function TalentPnlBreakdownList({
  title,
  rows,
  className = "",
}: TalentPnlBreakdownListProps) {
  if (rows.length === 0) return null;

  return (
    <section
      className={[
        "overflow-hidden rounded-card border border-card-border bg-card shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="border-b border-card-border px-4 py-3 sm:px-5">
        <Text variant="title" className="text-base">
          {title}
        </Text>
      </div>
      <ul className="divide-y divide-card-border">
        {rows.map((row) => (
          <li
            key={row.id}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 sm:px-5"
          >
            <Text variant="cardTitle" className="min-w-0 truncate">
              {row.name}
            </Text>
            <Text variant="caption" className="shrink-0 text-xs">
              {fmtMoney(row.fee)} − {fmtMoney(row.expenses)}
            </Text>
            <Text
              variant="caption"
              className={[
                "w-16 shrink-0 text-right text-xs font-semibold sm:w-20",
                row.profit >= 0 ? "text-primary-hover!" : "text-danger!",
              ].join(" ")}
            >
              {fmtMoney(row.profit)}
            </Text>
          </li>
        ))}
      </ul>
    </section>
  );
}
