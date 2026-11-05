"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Spinner } from "@/components/feedback/spinner";
import { useDiningTablesQuery } from "@/features/branch/hooks";
import type { DiningTableRow } from "@/features/branch/api";

const columns: ColumnDef<DiningTableRow>[] = [
  { header: "Code", accessorKey: "code" },
  { header: "Name", accessorKey: "name" },
  { header: "Seats", accessorKey: "seating_capacity" },
  { header: "Floor id", accessorKey: "floor_id" },
  { header: "Hall id", accessorKey: "hall_id" },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ getValue }) => {
      const s = String(getValue());
      const variant =
        s === "available" ? "success" : s === "occupied" ? "warning" : "secondary";
      return <Badge variant={variant}>{s}</Badge>;
    },
  },
];

export function TablesListPage({ branchId }: { branchId: number }) {
  const q = useDiningTablesQuery(branchId);
  const rows = q.data ?? [];

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Dining tables"
          description="Operational tables for dine-in and seating maps."
          actions={
            <Button asChild>
              <Link href={`/branches/${branchId}/tables/new`}>New table</Link>
            </Button>
          }
        />
        {q.isError ? (
          <ErrorState
            message={q.error ? String((q.error as Error).message) : "Failed to load"}
            onRetry={() => q.refetch()}
          />
        ) : null}
        {q.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Spinner className="size-4" />
            Loading tables…
          </div>
        ) : null}
        {!q.isLoading && !q.isError && rows.length === 0 ? (
          <EmptyState title="No tables" description="Create a table to start seating guests." />
        ) : null}
        {!q.isLoading && !q.isError && rows.length > 0 ? <DataTable data={rows} columns={columns} /> : null}
      </div>
    </PageContainer>
  );
}
