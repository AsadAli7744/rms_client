"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SeatingMapView } from "@/features/seating/seating-map-view";
import { useFloorsQuery, useHallsQuery, useDiningTablesQuery } from "@/features/branch/hooks";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function SeatingMapPage({ branchId }: { branchId: number }) {
  const floors = useFloorsQuery(branchId, 1, 200);
  const halls = useHallsQuery(branchId, undefined, 1, 500);
  const tables = useDiningTablesQuery(branchId);

  const isLoading = floors.isLoading || halls.isLoading || tables.isLoading;
  const isError = floors.isError || halls.isError || tables.isError;
  const errorMessage =
    (floors.error && String((floors.error as Error).message)) ||
    (halls.error && String((halls.error as Error).message)) ||
    (tables.error && String((tables.error as Error).message));

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Seating map"
          description="Branch → floor → hall → table, grouped from structured links (fallbacks to “Unassigned”)."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await Promise.all([floors.refetch(), halls.refetch(), tables.refetch()]);
                toast.success("Seating map updated");
              }}
              disabled={isLoading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          }
        />
        <SeatingMapView
          floors={floors.data?.data ?? []}
          halls={halls.data?.data ?? []}
          tables={tables.data ?? []}
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage ?? undefined}
          onRetry={() => {
            void floors.refetch();
            void halls.refetch();
            void tables.refetch();
          }}
        />
      </div>
    </PageContainer>
  );
}
