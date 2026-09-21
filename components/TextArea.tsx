import type { TextareaHTMLAttributes } from "react";
import { fieldText, type ControlSize } from "@/lib/control";

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & {
  size?: ControlSize;
  full?: boolean;
};

const areaPadding = {
  sm: "px-3 py-2.5",
  md: "px-3.5 py-3",
  lg: "px-5 py-3.5",
} as const;

export function TextArea({
  size = "md",
  full = false,
  className = "",
  rows = 3,
  ...props
}: TextAreaProps) {
  return (
    <textarea
      rows={rows}
      className={[
        "block min-w-0 resize-y rounded-input border border-border bg-card text-ink placeholder:text-placeholder focus:outline-none",
        areaPadding[size],
        fieldText[size],
        full ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
