import type { ReactNode } from "react";
import { Text } from "@/components/Text";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
};

export function Field({ id, label, hint, className = "", children }: FieldProps) {
  return (
    <div className={["space-y-1.5", className].filter(Boolean).join(" ")}>
      <Text as="label" variant="label" htmlFor={id}>
        {label}
      </Text>
      {children}
      {hint ? <Text variant="caption">{hint}</Text> : null}
    </div>
  );
}
