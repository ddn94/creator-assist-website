import type { ReactNode } from "react";
import { categoryPill, type Category } from "@/lib/ui";

type CategoryPillProps = {
  category: Category;
  className?: string;
  children: ReactNode;
};

export function CategoryPill({
  category,
  className = "",
  children,
}: CategoryPillProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.75 py-1 font-display text-xs font-semibold whitespace-nowrap",
        categoryPill[category],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
