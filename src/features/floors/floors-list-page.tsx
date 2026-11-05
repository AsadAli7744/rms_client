"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ServerDataTable } from "@/components/table/server-data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFloorsQuery } from "@/features/branch/hooks";
import type { FloorRow } from "@/features/branch/api";
import { useQueryFilters } from "@/hooks/use-query-filters";

const columns: ColumnDef<FloorRow>[] = [
  { header: "Name", accessorKey: "name" },
  { header: "Code", accessorKey: "code" },
  { header: "Sort", accessorKey: "sort_order" },
  {
    header: "Active",
    accessorKey: "is_active",
    cell: ({ getValue }) => (
      <Badge variant={getValue() ? "success" : "secondary"}>
        {getValue() ? "yes" : "no"}
      </Badge>
    ),
  },
];

export function FloorsListPage({ branchId }: { branchId: number }) {
  const { snapshot, setParams } = useQueryFilters();
  const page = Number(snapshot.page ?? "1") || 1;
  const limit = Number(snapshot.limit ?? "50") || 50;
  const q = useFloorsQuery(branchId, page, limit);

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Floors"
          description="Structured floors for this branch (used by halls and seating maps)."
          actions={
            <Button asChild>
              <Link href={`/branches/${branchId}/floors/new`}>New floor</Link>
            </Button>
          }
        />
        <ServerDataTable
          columns={columns}
          rows={q.data?.data ?? []}
          isLoading={q.isLoading}
          isError={q.isError}
          errorMessage={q.error ? String((q.error as Error).message) : undefined}
          onRetry={() => q.refetch()}
          page={page}
          limit={limit}
          total={q.data?.total ?? 0}
          onPageChange={(p) => setParams({ page: p })}
          onLimitChange={(l) => setParams({ page: 1, limit: l })}
          emptyTitle="No floors"
        />
      </div>
    </PageContainer>
  );
}
