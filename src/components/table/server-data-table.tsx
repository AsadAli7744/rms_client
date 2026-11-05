"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import { PaginationFooter } from "@/components/table/pagination-footer";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Spinner } from "@/components/feedback/spinner";
import { Skeleton } from "@/components/ui/skeleton";

export function ServerDataTable<T>({
  title,
  toolbar,
  columns,
  rows,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  emptyTitle,
  emptyDescription,
}: {
  title?: string;
  toolbar?: ReactNode;
  columns: ColumnDef<T, unknown>[];
  rows: T[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  page: number;
  limit: number;
  total: number;
  onPageChange: (p: number) => void;
  onLimitChange?: (l: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return (
    <div className="space-y-3">
      {(title || toolbar) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {title ? (
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
          ) : (
            <div />
          )}
          {toolbar}
        </div>
      )}
      {isError ? (
        <ErrorState message={errorMessage ?? "Failed to load data"} onRetry={onRetry} />
      ) : null}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Spinner className="size-4" />
            Loading…
          </div>
        </div>
      ) : null}
      {!isLoading && !isError && rows.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? "No data"}
          description={emptyDescription}
        />
      ) : null}
      {!isLoading && !isError && rows.length > 0 ? (
        <DataTable data={rows} columns={columns} />
      ) : null}
      {!isLoading && !isError ? (
        <PaginationFooter
          page={page}
          limit={limit}
          total={total}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      ) : null}
    </div>
  );
}
