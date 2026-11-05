"use client";

import { Button } from "@/components/ui/button";
import { useServerPagination } from "@/hooks/use-server-pagination";

export function PaginationFooter({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (p: number) => void;
  onLimitChange?: (l: number) => void;
}) {
  const { pageCount, safePage, from, to } = useServerPagination(page, limit, total);
  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-neutral-600 dark:text-neutral-400">
        {total === 0 ? (
          <span>No records</span>
        ) : (
          <span>
            Showing <span className="font-medium text-neutral-900 dark:text-neutral-100">{from}</span>–
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{to}</span> of{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{total}</span>
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onLimitChange ? (
          <label className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <span className="text-xs">Rows</span>
            <select
              className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            Prev
          </Button>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            Page {safePage} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= pageCount}
            onClick={() => onPageChange(safePage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
