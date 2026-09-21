import type { InputHTMLAttributes } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  className?: string;
};

export function Checkbox({
  label,
  className = "",
  id,
  ...props
}: CheckboxProps) {
  const input = (
    <input
      id={id}
      type="checkbox"
      className={[
        "size-4 shrink-0 rounded border-border accent-primary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );

  if (!label) return input;

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 font-sans text-sm font-medium text-ink"
    >
      {input}
      {label}
    </label>
  );
}
