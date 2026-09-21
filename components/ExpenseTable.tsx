import {
  DataTable,
  DataTableEmpty,
  DataTableHeader,
  DataTableRow,
  dataTableRowPad,
  type DataTableVariant,
} from "@/components/DataTable";
import { Text } from "@/components/Text";
import {
  formatLiveDate,
  fmtMoney,
  type TrackerExpense,
} from "@/lib/tracker";

type ExpenseTableProps = {
  expenses: TrackerExpense[];
  onRemove: (id: string) => void;
  variant?: DataTableVariant;
  className?: string;
};

const COLUMNS =
  "grid-cols-[6.5rem_minmax(5rem,0.9fr)_minmax(8rem,1.4fr)_5.5rem_4rem]";

export function ExpenseTable({
  expenses,
  onRemove,
  variant = "card",
  className = "",
}: ExpenseTableProps) {
  const pad = dataTableRowPad(variant);

  if (expenses.length === 0) {
    return (
      <DataTable variant={variant} className={["mb-4", className].join(" ")}>
        <DataTableEmpty variant={variant}>No expenses logged.</DataTableEmpty>
      </DataTable>
    );
  }

  return (
    <DataTable variant={variant} className={["mb-4", className].join(" ")}>
      <DataTableHeader
        variant={variant}
        columns={COLUMNS}
        labels={["Date", "Category", "Note", "Amount", ""]}
        align={["left", "left", "left", "right", "left"]}
      />

      {expenses.map((item) => (
        <DataTableRow key={item.id} variant={variant}>
          <div
            className={`flex items-center justify-between gap-3 md:hidden ${pad}`}
          >
            <div className="min-w-0">
              <Text variant="cardTitle" className="truncate capitalize">
                {item.category}
              </Text>
              <Text variant="caption" className="mt-0.5">
                {formatLiveDate(item.date)}
                {item.note ? ` · ${item.note}` : ""}
              </Text>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Text variant="caption" className="font-medium text-ink">
                {fmtMoney(item.amount)}
              </Text>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="cursor-pointer text-xs text-danger hover:underline"
              >
                Remove
              </button>
            </div>
          </div>

          <div className={`hidden items-center gap-3 md:grid ${COLUMNS} ${pad}`}>
            <Text variant="caption" className="text-ink">
              {formatLiveDate(item.date)}
            </Text>
            <Text variant="cardTitle" className="truncate capitalize">
              {item.category}
            </Text>
            <Text variant="caption" className="truncate text-muted">
              {item.note ?? "—"}
            </Text>
            <Text variant="caption" className="text-right text-ink">
              {fmtMoney(item.amount)}
            </Text>
            <div className="justify-self-end">
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="cursor-pointer text-xs text-danger hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </DataTableRow>
      ))}
    </DataTable>
  );
}
