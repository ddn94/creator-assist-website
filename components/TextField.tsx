import type { InputHTMLAttributes, ReactNode } from "react";
import { controlSizes, fieldText, type ControlSize } from "@/lib/control";

const iconInset = {
  sm: { padLeft: "pl-8", padRight: "pr-8", posLeft: "left-2.5", posRight: "right-2.5" },
  md: { padLeft: "pl-10", padRight: "pr-10", posLeft: "left-3.5", posRight: "right-3.5" },
  lg: { padLeft: "pl-12", padRight: "pr-12", posLeft: "left-5", posRight: "right-5" },
} as const;

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: ControlSize;
  full?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

function Icon({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  if (children == null || children === false) return null;
  return (
    <span
      className={`pointer-events-none absolute inset-y-0 z-10 inline-flex items-center text-muted ${className}`}
      aria-hidden
    >
      {children}
    </span>
  );
}

export function TextField({
  size = "md",
  full = false,
  iconLeft,
  iconRight,
  className = "",
  ...props
}: TextFieldProps) {
  const inset = iconInset[size];

  return (
    <div className={`relative ${full ? "w-full" : ""}`}>
      <Icon className={inset.posLeft}>{iconLeft}</Icon>
      <input
        className={[
          "min-w-0 rounded-input border border-border bg-card text-ink placeholder:text-placeholder focus:outline-none",
          controlSizes[size],
          fieldText[size],
          iconLeft ? inset.padLeft : "",
          iconRight ? inset.padRight : "",
          full ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      <Icon className={inset.posRight}>{iconRight}</Icon>
    </div>
  );
}
