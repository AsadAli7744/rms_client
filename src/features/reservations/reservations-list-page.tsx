"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ServerDataTable } from "@/components/table/server-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";
import { useReservationsQuery } from "@/features/branch/hooks";
import type { ReservationRow } from "@/features/branch/api";
import { useQueryFilters } from "@/hooks/use-query-filters";

const columns: ColumnDef<ReservationRow>[] = [
  { header: "Guest", accessorKey: "customer_name" },
  { header: "Phone", accessorKey: "customer_phone" },
  {
    header: "Date",
    accessorKey: "reservation_date",
    cell: ({ getValue }) => formatDate(String(getValue())),
  },
  { header: "Time", accessorKey: "reservation_time" },
  { header: "Guests", accessorKey: "guest_count" },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ getValue }) => <Badge variant="secondary">{String(getValue())}</Badge>,
  },
];

export function ReservationsListPage({ branchId }: { branchId: number }) {
  const { snapshot, setParams } = useQueryFilters();
  const page = Number(snapshot.page ?? "1") || 1;
  const limit = Number(snapshot.limit ?? "20") || 20;
  const q = useReservationsQuery(branchId, page, limit);

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Reservations"
          description="Operational reservations for this branch."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await q.refetch();
                toast.success("Reservations updated");
              }}
              disabled={q.isFetching}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`size-3.5 ${q.isFetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
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
          emptyTitle="No reservations"
        />
      </div>
    </PageContainer>
  );
}
