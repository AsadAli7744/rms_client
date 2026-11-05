"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/filters/filter-bar";
import { SearchInput } from "@/components/filters/search-input";
import { ServerDataTable } from "@/components/table/server-data-table";
import { Button } from "@/components/ui/button";
import { useQueryFilters } from "@/hooks/use-query-filters";
import { useDebounce } from "@/hooks/use-debounce";
import { useBranchesQuery } from "@/features/branches/hooks";
import { branchColumns } from "@/features/branches/columns";

export function BranchesPageClient() {
  const { snapshot, setParams } = useQueryFilters();
  const page = Number(snapshot.page ?? "1") || 1;
  const limit = Number(snapshot.limit ?? "20") || 20;
  const [localQ, setLocalQ] = useState("");
  const debouncedQ = useDebounce(localQ, 300);

  const restaurantId = snapshot.restaurant_id
    ? Number(snapshot.restaurant_id)
    : undefined;

  const query = useBranchesQuery({
    page,
    limit,
    restaurant_id: restaurantId,
    q: debouncedQ || undefined,
  });

  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;

  const toolbar = useMemo(
    () => (
      <FilterBar
        onReset={() => {
          setLocalQ("");
          setParams({ page: 1, q: null, restaurant_id: null });
        }}
      >
        <div className="w-full sm:max-w-md">
          <SearchInput value={localQ} onChange={setLocalQ} />
        </div>
      </FilterBar>
    ),
    [setParams],
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Branches"
          description="Pick a branch to manage floors, halls, tables, and reservations."
          actions={
            <Button asChild variant="secondary">
              <Link href="/branches">Refresh</Link>
            </Button>
          }
        />
        {toolbar}
        <ServerDataTable
          columns={branchColumns}
          rows={rows}
          isLoading={query.isLoading}
          isError={query.isError}
          errorMessage={query.error ? String((query.error as Error).message) : undefined}
          onRetry={() => query.refetch()}
          page={page}
          limit={limit}
          total={total}
          onPageChange={(p) => setParams({ page: p })}
          onLimitChange={(l) => setParams({ page: 1, limit: l })}
          emptyTitle="No branches found"
          emptyDescription="Create a branch in the API (or adjust filters) to see it here."
        />
      </div>
    </PageContainer>
  );
}
