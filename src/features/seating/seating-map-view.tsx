"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Spinner } from "@/components/feedback/spinner";
import type { DiningTableRow, FloorRow, HallRow } from "@/features/branch/api";

function TableStatusBadge({ status }: { status: string }) {
  const variant =
    status === "available"
      ? "success"
      : status === "occupied"
        ? "warning"
        : status === "reserved"
          ? "secondary"
          : "outline";
  return <Badge variant={variant}>{status}</Badge>;
}

export function SeatingMapView({
  floors,
  halls,
  tables,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: {
  floors: FloorRow[];
  halls: HallRow[];
  tables: DiningTableRow[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}) {
  const model = useMemo(() => {
    const floorById = new Map(floors.map((f) => [f.id, f]));
    const hallById = new Map(halls.map((h) => [h.id, h]));

    const grouped = new Map<
      string,
      { label: string; tables: DiningTableRow[] }
    >();

    for (const t of tables) {
      let key = "unassigned";
      let label = "Unassigned";
      if (t.hall_id != null) {
        const hall = hallById.get(t.hall_id);
        const floor = hall ? floorById.get(hall.floor_id) : undefined;
        key = `hall:${t.hall_id}`;
        label = `${floor?.name ?? "Floor"} → ${hall?.name ?? "Hall"}`;
      } else if (t.floor_id != null) {
        const floor = floorById.get(t.floor_id);
        key = `floor:${t.floor_id}`;
        label = floor?.name ?? `Floor #${t.floor_id}`;
      }
      const bucket = grouped.get(key) ?? { label, tables: [] };
      bucket.tables.push(t);
      grouped.set(key, bucket);
    }

    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [floors, halls, tables]);

  if (isError) {
    return <ErrorState message={errorMessage ?? "Failed to load seating map"} onRetry={onRetry} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Spinner className="size-4" />
        Loading seating map…
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <EmptyState
        title="No tables yet"
        description="Create tables (optionally linked to floors/halls) to see the map."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {model.map(([key, group]) => (
        <Card key={key}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.tables.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
              >
                <div className="space-y-0.5">
                  <div className="font-medium">
                    {t.code}
                    {t.name ? <span className="text-neutral-500"> — {t.name}</span> : null}
                  </div>
                  <div className="text-xs text-neutral-500">
                    Seats {t.seating_capacity}
                  </div>
                </div>
                <TableStatusBadge status={t.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
