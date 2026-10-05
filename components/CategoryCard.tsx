import type { ReactNode } from "react";
import { categoryCard, type Category } from "@/lib/ui";

type CategoryCardProps = {
  id?: string;
  category: Category;
  className?: string;
  children: ReactNode;
  /** Product-tour target. Renders data-tour. */
  tour?: string;
};

export function CategoryCard({
  id,
  category,
  className = "",
  children,
  tour,
}: CategoryCardProps) {
  return (
    <div
      id={id}
      data-tour={tour}
      className={["rounded-card", categoryCard[category], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
