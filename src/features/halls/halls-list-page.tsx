"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ServerDataTable } from "@/components/table/server-data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHallsQuery } from "@/features/branch/hooks";
import type { HallRow } from "@/features/branch/api";
import { useQueryFilters } from "@/hooks/use-query-filters";

const columns: ColumnDef<HallRow>[] = [
  { header: "Name", accessorKey: "name" },
  { header: "Floor id", accessorKey: "floor_id" },
  { header: "Code", accessorKey: "code" },
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

export function HallsListPage({ branchId }: { branchId: number }) {
  const { snapshot, setParams } = useQueryFilters();
  const page = Number(snapshot.page ?? "1") || 1;
  const limit = Number(snapshot.limit ?? "50") || 50;
  const floorId = snapshot.floor_id ? Number(snapshot.floor_id) : undefined;
  const q = useHallsQuery(branchId, floorId, page, limit);

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Halls"
          description="Halls belong to a floor and contain tables in the seating map."
          actions={
            <Button asChild>
              <Link href={`/branches/${branchId}/halls/new`}>New hall</Link>
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
          emptyTitle="No halls"
        />
      </div>
    </PageContainer>
  );
}
