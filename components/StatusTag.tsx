import { statusPill } from "@/lib/ui";

/** Soft roster tags + payment status pills (see lib/ui.ts guidelines). */
export const statusTagStyles = {
  active: "bg-collab text-primary-hover",
  invited: "bg-idea text-ink",
  record: "bg-background text-muted",
  overdue: statusPill.overdue,
  awaiting: statusPill.awaiting,
  notInvoiced: `${statusPill.notInvoiced} border border-border`,
  paid: statusPill.paid,
} as const;

export type StatusTagTone = keyof typeof statusTagStyles;

type StatusTagProps = {
  label: string;
  tone?: StatusTagTone;
  className?: string;
};

export function StatusTag({
  label,
  tone = "record",
  className = "",
}: StatusTagProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.75 py-1 font-display text-xs font-semibold whitespace-nowrap",
        statusTagStyles[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </span>
  );
}
