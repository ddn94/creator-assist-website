import type { ReactNode } from "react";
import { categoryCard, type Category } from "@/lib/ui";

type CategoryCardProps = {
  id?: string;
  category: Category;
  className?: string;
  children: ReactNode;
};

export function CategoryCard({
  id,
  category,
  className = "",
  children,
}: CategoryCardProps) {
  return (
    <div
      id={id}
      className={["rounded-card", categoryCard[category], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
