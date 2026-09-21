"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Text } from "@/components/Text";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (total <= pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(0, page), totalPages - 1);
  const start = currentPage * pageSize;

  return (
    <div
      className={[
        "flex items-center justify-between gap-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Text variant="caption">
        {start + 1}–{Math.min(start + pageSize, total)} of {total}
      </Text>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Previous page"
          disabled={currentPage === 0}
          className="inline-flex size-8 items-center justify-center text-ink transition-colors disabled:opacity-40"
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        >
          <CaretLeftIcon size={16} weight="bold" />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={currentPage >= totalPages - 1}
          className="inline-flex size-8 items-center justify-center text-ink transition-colors disabled:opacity-40"
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        >
          <CaretRightIcon size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
