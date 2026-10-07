import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
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
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  editingId?: string | null;
  actionsDisabled?: boolean;
  variant?: DataTableVariant;
  className?: string;
  currency?: string;
};

const COLUMNS =
  "grid-cols-[6.5rem_minmax(5rem,0.9fr)_minmax(8rem,1.4fr)_5.5rem_5.5rem]";
const READ_COLUMNS =
  "grid-cols-[6.5rem_minmax(5rem,0.9fr)_minmax(8rem,1.4fr)_5.5rem]";

export function ExpenseTable({
  expenses,
  onEdit,
  onRemove,
  editingId,
  actionsDisabled = false,
  variant = "card",
  className = "",
  currency = "USD",
}: ExpenseTableProps) {
  const pad = dataTableRowPad(variant);
  const money = (item: TrackerExpense) =>
    fmtMoney(item.amount, item.currency?.trim() || currency);
  const actions = Boolean(onEdit || onRemove);
  const columns = actions ? COLUMNS : READ_COLUMNS;

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
        columns={columns}
        labels={
          actions
            ? ["Date", "Category", "Note", "Amount", ""]
            : ["Date", "Category", "Note", "Amount"]
        }
        align={
          actions
            ? ["left", "left", "left", "right", "left"]
            : ["left", "left", "left", "right"]
        }
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
                {money(item)}
              </Text>
              <LineActions
                editing={editingId === item.id}
                onEdit={onEdit ? () => onEdit(item.id) : undefined}
                onRemove={onRemove ? () => onRemove(item.id) : undefined}
                editLabel="Edit expense"
                deleteLabel="Delete expense"
                disabled={actionsDisabled}
              />
            </div>
          </div>

          <div className={`hidden items-center gap-3 md:grid ${columns} ${pad}`}>
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
              {money(item)}
            </Text>
            {actions ? (
              <LineActions
                editing={editingId === item.id}
                onEdit={onEdit ? () => onEdit(item.id) : undefined}
                onRemove={onRemove ? () => onRemove(item.id) : undefined}
                editLabel="Edit expense"
                deleteLabel="Delete expense"
                disabled={actionsDisabled}
              />
            ) : null}
          </div>
        </DataTableRow>
      ))}
    </DataTable>
  );
}

function LineActions({
  onEdit,
  onRemove,
  editing,
  editLabel,
  deleteLabel,
  disabled = false,
}: {
  onEdit?: () => void;
  onRemove?: () => void;
  editing?: boolean;
  editLabel: string;
  deleteLabel: string;
  disabled?: boolean;
}) {
  if (!onEdit && !onRemove) return null;
  return (
    <div className="flex shrink-0 items-center justify-end justify-self-end">
      {onEdit ? (
        <button
          type="button"
          aria-label={editLabel}
          aria-pressed={editing}
          disabled={disabled}
          onClick={onEdit}
          className={[
            "inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-organic disabled:cursor-not-allowed disabled:opacity-40",
            editing ? "text-ink" : "text-muted hover:text-ink",
          ].join(" ")}
        >
          <PencilSimpleIcon size={16} weight="regular" aria-hidden />
        </button>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          aria-label={deleteLabel}
          disabled={disabled}
          onClick={onRemove}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-danger transition-colors hover:bg-organic disabled:cursor-not-allowed disabled:opacity-40"
        >
          <TrashIcon size={16} weight="regular" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
