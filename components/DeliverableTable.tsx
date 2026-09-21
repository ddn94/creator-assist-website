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
  onRemove: (id: string) => void;
  variant?: DataTableVariant;
  className?: string;
};

const COLUMNS = "grid-cols-[minmax(6rem,1.2fr)_4.5rem_5rem_5.5rem_4rem]";

export function DeliverableTable({
  deliverables,
  onRemove,
  variant = "card",
  className = "",
}: DeliverableTableProps) {
  const pad = dataTableRowPad(variant);

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
        columns={COLUMNS}
        labels={["Type", "Volume", "Rate", "Line total", ""]}
        align={["left", "right", "right", "right", "left"]}
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
                {item.quantity} × {fmtMoney(item.rate)}
              </Text>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Text variant="caption" className="font-medium text-ink">
                {fmtMoney(item.quantity * item.rate)}
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
            <Text variant="cardTitle" className="truncate">
              {DELIVERABLE_TYPE_LABELS[item.type]}
            </Text>
            <Text variant="caption" className="text-right text-ink">
              {item.quantity}
            </Text>
            <Text variant="caption" className="text-right text-ink">
              {fmtMoney(item.rate)}
            </Text>
            <Text variant="caption" className="text-right font-medium text-ink">
              {fmtMoney(item.quantity * item.rate)}
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

      <DataTableFooter
        variant={variant}
        className="flex items-center justify-between gap-3 md:grid md:grid-cols-[minmax(6rem,1.2fr)_4.5rem_5rem_5.5rem_4rem] md:gap-3"
      >
        <Text variant="caption" className="md:col-span-3 md:text-right">
          Deliverables total
        </Text>
        <Text
          variant="caption"
          className="font-semibold text-ink md:text-right"
        >
          {fmtMoney(total)}
        </Text>
        <span className="hidden md:block" />
      </DataTableFooter>
    </DataTable>
  );
}
