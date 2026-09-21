import type { ReactNode } from "react";
import { Text } from "@/components/Text";

export const statCardTones = {
  collab: "bg-collab",
  payment: "bg-payment",
  organic: "bg-organic",
  idea: "bg-idea",
} as const;

export type StatCardTone = keyof typeof statCardTones;

type StatCardProps = {
  label: string;
  value: ReactNode;
  footer?: string;
  tone?: StatCardTone;
  valueClassName?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  footer,
  tone = "collab",
  valueClassName = "",
  className = "",
}: StatCardProps) {
  return (
    <div
      className={[
        "rounded-card p-4 sm:p-5",
        statCardTones[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Text variant="caption" className="font-medium">
        {label}
      </Text>
      <Text
        variant="stat"
        className={["mt-2 text-2xl sm:text-3xl leading-none", valueClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </Text>
      {footer ? (
        <Text variant="caption" className="mt-2">
          {footer}
        </Text>
      ) : null}
    </div>
  );
}
