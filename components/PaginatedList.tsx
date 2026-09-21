"use client";

import { useState, type ReactNode } from "react";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 4;

type PaginatedListProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  className?: string;
  pageSize?: number;
};

export function PaginatedList<T>({
  items,
  getKey,
  renderItem,
  className = "",
  pageSize = PAGE_SIZE,
}: PaginatedListProps<T>) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * pageSize;
  const visible = items.slice(start, start + pageSize);

  return (
    <div className={className}>
      <div className="space-y-1">
        {visible.map((item) => (
          <div key={getKey(item)}>{renderItem(item)}</div>
        ))}
      </div>

      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={items.length}
        onPageChange={setPage}
        className="mt-2"
      />
    </div>
  );
}
