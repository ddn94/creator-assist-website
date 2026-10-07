import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import {
  DataTable,
  DataTableEmpty,
  DataTableFooter,
  DataTableHeader,
  DataTableRow,
  dataTableRowPad,
  type DataTableVariant,
} from "@/components/DataTable";
import { Text } from "@/components/Text";
import {
  DELIVERABLE_TYPE_LABELS,
  deliverablesTotal,
  fmtMoney,
  type TrackerDeliverable,
} from "@/lib/tracker";

type DeliverableTableProps = {
  deliverables: TrackerDeliverable[];
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  editingId?: string | null;
  variant?: DataTableVariant;
  className?: string;
  currency?: string;
};

const COLUMNS = "grid-cols-[minmax(6rem,1.2fr)_4.5rem_5rem_5.5rem_5.5rem]";
const READ_COLUMNS = "grid-cols-[minmax(6rem,1.2fr)_4.5rem_5rem_5.5rem]";

export function DeliverableTable({
  deliverables,
  onEdit,
  onRemove,
  editingId,
  variant = "card",
  className = "",
  currency = "USD",
}: DeliverableTableProps) {
  const pad = dataTableRowPad(variant);
  const money = (amount: number) => fmtMoney(amount, currency);
  const actions = Boolean(onEdit || onRemove);
  const columns = actions ? COLUMNS : READ_COLUMNS;

  if (deliverables.length === 0) {
    return (
      <DataTable variant={variant} className={["mb-3", className].join(" ")}>
        <DataTableEmpty variant={variant}>No deliverables itemized.</DataTableEmpty>
      </DataTable>
    );
  }

  const total = deliverablesTotal(deliverables);

  return (
    <DataTable variant={variant} className={["mb-3", className].join(" ")}>
      <DataTableHeader
        variant={variant}
        columns={columns}
        labels={
          actions
            ? ["Type", "Volume", "Rate", "Line total", ""]
            : ["Type", "Volume", "Rate", "Line total"]
        }
        align={
          actions
            ? ["left", "right", "right", "right", "left"]
            : ["left", "right", "right", "right"]
        }
      />

      {deliverables.map((item) => (
        <DataTableRow key={item.id} variant={variant}>
          <div
            className={`flex items-center justify-between gap-3 md:hidden ${pad}`}
          >
            <div className="min-w-0">
              <Text variant="cardTitle" className="truncate">
                {DELIVERABLE_TYPE_LABELS[item.type]}
              </Text>
              <Text variant="caption" className="mt-0.5">
                {item.quantity} × {money(item.rate)}
              </Text>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Text variant="caption" className="font-medium text-ink">
                {money(item.quantity * item.rate)}
              </Text>
              <LineActions
                editing={editingId === item.id}
                onEdit={onEdit ? () => onEdit(item.id) : undefined}
                onRemove={onRemove ? () => onRemove(item.id) : undefined}
                editLabel="Edit deliverable"
                deleteLabel="Delete deliverable"
              />
            </div>
          </div>

          <div className={`hidden items-center gap-3 md:grid ${columns} ${pad}`}>
            <Text variant="cardTitle" className="truncate">
              {DELIVERABLE_TYPE_LABELS[item.type]}
            </Text>
            <Text variant="caption" className="text-right text-ink">
              {item.quantity}
            </Text>
            <Text variant="caption" className="text-right text-ink">
              {money(item.rate)}
            </Text>
            <Text variant="caption" className="text-right font-medium text-ink">
              {money(item.quantity * item.rate)}
            </Text>
            {actions ? (
              <LineActions
                editing={editingId === item.id}
                onEdit={onEdit ? () => onEdit(item.id) : undefined}
                onRemove={onRemove ? () => onRemove(item.id) : undefined}
                editLabel="Edit deliverable"
                deleteLabel="Delete deliverable"
              />
            ) : null}
          </div>
        </DataTableRow>
      ))}

      <DataTableFooter
        variant={variant}
        className={`flex items-center justify-between gap-3 md:grid ${columns} md:gap-3`}
      >
        <Text variant="caption" className="md:col-span-3 md:text-right">
          Deliverables total
        </Text>
        <Text
          variant="caption"
          className="font-semibold text-ink md:text-right"
        >
          {money(total)}
        </Text>
        {actions ? <span className="hidden md:block" /> : null}
      </DataTableFooter>
    </DataTable>
  );
}

function LineActions({
  onEdit,
  onRemove,
  editing,
  editLabel,
  deleteLabel,
}: {
  onEdit?: () => void;
  onRemove?: () => void;
  editing?: boolean;
  editLabel: string;
  deleteLabel: string;
}) {
  if (!onEdit && !onRemove) return null;
  return (
    <div className="flex shrink-0 items-center justify-end justify-self-end">
      {onEdit ? (
        <button
          type="button"
          aria-label={editLabel}
          aria-pressed={editing}
          onClick={onEdit}
          className={[
            "inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-organic",
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
          onClick={onRemove}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-danger transition-colors hover:bg-organic"
        >
          <TrashIcon size={16} weight="regular" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
