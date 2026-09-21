import Link from "next/link";
import { CategoryPill } from "@/components/CategoryPill";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import {
  contentTypeCategory,
  contentTypeLabel,
  fmtMoney,
  paymentStatusTone,
  type TalentPnlContentRow,
} from "@/lib/talentPnl";

const COLUMNS = [
  "Content",
  "Type",
  "Brand",
  "Payment",
  "Fee",
  "Expenses",
  "Profit",
] as const;

type TalentPnlContentTableProps = {
  rows: TalentPnlContentRow[];
  className?: string;
};

export function TalentPnlContentTable({
  rows,
  className = "",
}: TalentPnlContentTableProps) {
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
          Per-content P&amp;L
        </Text>
      </div>

      {/* Mobile cards */}
      <div className="space-y-0 md:hidden">
        {rows.map((row) => (
          <div
            key={row.id}
            className="border-b border-card-border px-4 py-4 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-3">
              <CategoryPill category={contentTypeCategory(row.type)}>
                {contentTypeLabel(row.type)}
              </CategoryPill>
              <Text
                variant="stat"
                className={[
                  "text-lg leading-none",
                  row.profit >= 0 ? "text-primary-hover" : "text-danger",
                ].join(" ")}
              >
                {fmtMoney(row.profit)}
              </Text>
            </div>
            <Link
              href={`/home/tracker/${row.contentId}`}
              className="mt-2 block font-display text-sm font-semibold text-ink hover:underline"
            >
              {row.title}
            </Link>
            <Text variant="caption" className="mt-1 text-xs">
              {row.fee != null ? `Fee ${fmtMoney(row.fee)}` : "No fee"} · Expenses{" "}
              {fmtMoney(row.expenses)}
            </Text>
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Text variant="description">
              No financial activity in this period.
            </Text>
          </div>
        ) : null}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-card-border bg-background/70">
              {COLUMNS.map((label, index) => (
                <th
                  key={label}
                  className={[
                    "px-4 py-2.5 font-sans text-xs font-medium text-muted whitespace-nowrap",
                    index >= 4 ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  {label}
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
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    href={`/home/tracker/${row.contentId}`}
                    className="font-display text-xs font-semibold text-ink hover:underline"
                  >
                    {row.title}
                  </Link>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <CategoryPill category={contentTypeCategory(row.type)}>
                    {contentTypeLabel(row.type)}
                  </CategoryPill>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Text variant="caption" className="text-xs text-ink">
                    {row.brand ?? "—"}
                  </Text>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {row.paymentStatus && row.paymentLabel ? (
                    row.paymentStatus === "notInvoiced" ? (
                      <Text variant="caption" className="text-xs">
                        {row.paymentLabel}
                      </Text>
                    ) : (
                      <StatusTag
                        label={row.paymentLabel}
                        tone={paymentStatusTone[row.paymentStatus]}
                      />
                    )
                  ) : (
                    <Text variant="caption" className="text-xs">
                      —
                    </Text>
                  )}
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <Text variant="caption" className="text-xs text-ink">
                    {row.fee != null ? fmtMoney(row.fee) : "—"}
                  </Text>
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <Text variant="caption" className="text-xs text-ink">
                    {fmtMoney(row.expenses)}
                  </Text>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Text
                    variant="caption"
                    className={[
                      "text-xs font-semibold",
                      row.profit >= 0
                        ? "text-primary-hover!"
                        : "text-danger!",
                    ].join(" ")}
                  >
                    {fmtMoney(row.profit)}
                  </Text>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <Text variant="description">
                    No financial activity in this period.
                  </Text>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
