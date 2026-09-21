import type { ReactNode } from "react";
import { Text } from "@/components/Text";

export type DataTableVariant = "card" | "plain";

const shellStyles = {
  card: "overflow-hidden rounded-card border border-card-border bg-card shadow-card",
  plain: "overflow-hidden bg-transparent",
} as const;

const headerStyles = {
  card: "border-b border-card-border bg-background/70 px-4 py-3",
  plain: "border-b border-border px-0 py-2",
} as const;

const rowStyles = {
  card: "border-b border-card-border last:border-b-0",
  plain: "border-b border-border",
} as const;

const rowPad = {
  card: "px-4 py-3.5",
  plain: "px-0 py-2.5",
} as const;

const footerStyles = {
  card: "border-t border-card-border bg-background/40 px-4 py-3",
  plain: "px-0 py-2.5",
} as const;

const emptyPad = {
  card: "px-4 py-8",
  plain: "px-0 py-6",
} as const;

type DataTableProps = {
  variant?: DataTableVariant;
  className?: string;
  children: ReactNode;
};

export function DataTable({
  variant = "card",
  className = "",
  children,
}: DataTableProps) {
  return (
    <div
      className={[shellStyles[variant], className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

type DataTableHeaderProps = {
  variant?: DataTableVariant;
  columns: string;
  labels: string[];
  align?: ("left" | "right")[];
};

export function DataTableHeader({
  variant = "card",
  columns,
  labels,
  align,
}: DataTableHeaderProps) {
  return (
    <div
      className={`hidden gap-3 md:grid ${columns} ${headerStyles[variant]}`}
    >
      {labels.map((label, index) => (
        <Text
          key={label || `col-${index}`}
          variant="caption"
          className={align?.[index] === "right" ? "text-right" : "truncate"}
        >
          {label}
        </Text>
      ))}
    </div>
  );
}

type DataTableRowProps = {
  variant?: DataTableVariant;
  className?: string;
  children: ReactNode;
};

export function DataTableRow({
  variant = "card",
  className = "",
  children,
}: DataTableRowProps) {
  return (
    <div className={[rowStyles[variant], className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export function dataTableRowPad(variant: DataTableVariant = "card") {
  return rowPad[variant];
}

type DataTableFooterProps = {
  variant?: DataTableVariant;
  className?: string;
  children: ReactNode;
};

export function DataTableFooter({
  variant = "card",
  className = "",
  children,
}: DataTableFooterProps) {
  return (
    <div
      className={[footerStyles[variant], className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

type DataTableEmptyProps = {
  variant?: DataTableVariant;
  children: ReactNode;
};

export function DataTableEmpty({
  variant = "card",
  children,
}: DataTableEmptyProps) {
  return (
    <div className={`${emptyPad[variant]} text-center`}>
      <Text variant="description">{children}</Text>
    </div>
  );
}
