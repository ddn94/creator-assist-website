import type { ReactNode } from "react";
import { Text } from "@/components/Text";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  action,
  back,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={["space-y-3", className].filter(Boolean).join(" ")}>
      {back}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Text variant="heading" className="text-2xl sm:text-3xl">
            {title}
          </Text>
          {description ? (
            <Text variant="description" className="mt-1">
              {description}
            </Text>
          ) : null}
        </div>
        {action ? <div className="shrink-0 sm:pt-1">{action}</div> : null}
      </div>
    </div>
  );
}
