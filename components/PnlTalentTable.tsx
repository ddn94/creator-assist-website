import { Avatar } from "@/components/Avatar";
import { Text } from "@/components/Text";
import type { PnlTalentRow } from "@/lib/pnl";

type PnlTalentTableProps = {
  rows: PnlTalentRow[];
  className?: string;
};

const HEADERS = [
  "Talent",
  "Currency",
  "Billed",
  "Received",
  "Outstanding",
  "Overdue",
] as const;

function dash(value: string | null) {
  return value ?? "—";
}

export function PnlTalentTable({ rows, className = "" }: PnlTalentTableProps) {
  return (
    <section
      className={[
        "rounded-card border border-card-border bg-card shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="border-b border-card-border px-4 py-3 sm:px-5">
        <Text variant="title" className="text-base">
          By talent
        </Text>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-card-border md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="space-y-2 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Avatar name={row.name} size="sm" />
              <div className="min-w-0">
                <Text variant="cardTitle" className="truncate">
                  {row.name}
                </Text>
                <Text variant="caption">{row.currency}</Text>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <Text variant="caption" className="text-ink">
                Billed {row.billed}
              </Text>
              <Text variant="caption" className="text-primary-hover">
                Received {row.received}
              </Text>
              <Text variant="caption" className="text-ink">
                Outstanding {row.outstanding}
              </Text>
              <Text
                variant="caption"
                className={
                  row.overdue ? "font-medium text-danger!" : "text-ink"
                }
              >
                Overdue {dash(row.overdue)}
              </Text>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-card-border bg-background/70">
              {HEADERS.map((label) => (
                <th key={label} scope="col" className="px-3 py-3 first:pl-5 last:pr-5">
                  <Text variant="caption" className="font-medium">
                    {label}
                  </Text>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-card-border last:border-b-0"
              >
                <td className="px-3 py-3 first:pl-5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={row.name} size="sm" />
                    <Text variant="cardTitle" className="truncate">
                      {row.name}
                    </Text>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Text variant="caption" className="text-muted">
                    {row.currency}
                  </Text>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Text variant="caption" className="text-ink!">
                    {row.billed}
                  </Text>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Text variant="caption" className="text-primary-hover!">
                    {row.received}
                  </Text>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Text variant="caption" className="text-ink!">
                    {row.outstanding}
                  </Text>
                </td>
                <td className="px-3 py-3 last:pr-5 whitespace-nowrap">
                  <Text
                    variant="caption"
                    className={
                      row.overdue
                        ? "font-medium text-danger!"
                        : "text-ink!"
                    }
                  >
                    {dash(row.overdue)}
                  </Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
