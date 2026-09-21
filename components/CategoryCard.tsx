import type { ReactNode } from "react";
import { categoryCard, type Category } from "@/lib/ui";

type CategoryCardProps = {
  category: Category;
  className?: string;
  children: ReactNode;
};

export function CategoryCard({
  category,
  className = "",
  children,
}: CategoryCardProps) {
  return (
    <div
      className={["rounded-card", categoryCard[category], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
