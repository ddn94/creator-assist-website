import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Text } from "@/components/Text";
import type { PnlTalentRow } from "@/lib/pnl";

type PnlTalentTableProps = {
  rows: PnlTalentRow[];
  className?: string;
};

const HEADERS = ["Talent", "Currency", "Revenue", "Expenses", "Profit"] as const;

function profitClass(value: string) {
  return value.includes("-")
    ? "font-medium text-danger!"
    : "font-medium text-primary-hover!";
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
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Text variant="description">
              No financial activity in this period.
            </Text>
          </div>
        ) : null}
        {rows.map((row) => (
          <div key={row.id} className="space-y-2 px-4 py-3.5">
            <Link
              href={`/workspace/talent/${row.id}`}
              className="group flex min-w-0 cursor-pointer items-center gap-2.5"
            >
              <Avatar name={row.name} size="sm" />
              <div className="min-w-0">
                <Text variant="cardTitle" className="truncate group-hover:underline">
                  {row.name}
                </Text>
                <Text variant="caption">{row.currency}</Text>
              </div>
            </Link>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <Text variant="caption" className="text-ink">
                Revenue {row.revenue}
              </Text>
              <Text variant="caption" className="text-ink">
                Expenses {row.expenses}
              </Text>
              <Text variant="caption" className={profitClass(row.profit)}>
                Profit {row.profit}
              </Text>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-xl border-collapse text-left">
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
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={HEADERS.length}
                  className="px-4 py-8 text-center"
                >
                  <Text variant="description">
                    No financial activity in this period.
                  </Text>
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-card-border last:border-b-0"
              >
                <td className="px-3 py-3 first:pl-5">
                  <Link
                    href={`/workspace/talent/${row.id}`}
                    className="group flex min-w-0 cursor-pointer items-center gap-2.5"
                  >
                    <Avatar name={row.name} size="sm" />
                    <Text variant="cardTitle" className="truncate group-hover:underline">
                      {row.name}
                    </Text>
                  </Link>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Text variant="caption" className="text-muted">
                    {row.currency}
                  </Text>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Text variant="caption" className="text-ink!">
                    {row.revenue}
                  </Text>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Text variant="caption" className="text-ink!">
                    {row.expenses}
                  </Text>
                </td>
                <td className="px-3 py-3 last:pr-5 whitespace-nowrap">
                  <Text variant="caption" className={profitClass(row.profit)}>
                    {row.profit}
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
