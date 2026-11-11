"use client";

import React, { useState } from "react";
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
import { QrCode, ExternalLink, Copy, Check, Plus, Users, Utensils, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TableQrDialog } from "@/components/ui/table-qr-dialog";

export function TablesListPage({ branchId }: { branchId: number }) {
  const q = useDiningTablesQuery(branchId);
  const rows = q.data ?? [];
  const [selectedTableForQr, setSelectedTableForQr] = useState<DiningTableRow | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const getTableQrUrl = (tableId: number) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/order?branchId=${branchId}&tableId=${tableId}`;
    }
    return `/order?branchId=${branchId}&tableId=${tableId}`;
  };

  const copyTableLink = (tableId: number) => {
    const url = getTableQrUrl(tableId);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Table QR Ordering URL copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const columns: ColumnDef<DiningTableRow>[] = [
    {
      header: "Table Code",
      accessorKey: "code",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
          {row.original.code}
        </span>
      ),
    },
    {
      header: "Name / Label",
      accessorKey: "name",
      cell: ({ row }) => (
        <span className="text-neutral-700 dark:text-neutral-300">
          {row.original.name || `Table ${row.original.code}`}
        </span>
      ),
    },
    {
      header: "Seating Capacity",
      accessorKey: "seating_capacity",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
          <Users className="size-3.5 text-neutral-400" />
          <span>{row.original.seating_capacity} seats</span>
        </span>
      ),
    },
    {
      header: "Floor / Hall",
      cell: ({ row }) => {
        const f = row.original.floor_id ? `Floor #${row.original.floor_id}` : null;
        const h = row.original.hall_id ? `Hall #${row.original.hall_id}` : null;
        const location = [f, h].filter(Boolean).join(" • ");
        return (
          <span className="text-xs text-neutral-500">
            {location || "Main Dining Area"}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) => {
        const s = String(getValue());
        const variant =
          s === "available" ? "success" : s === "occupied" ? "warning" : "secondary";
        return (
          <Badge variant={variant} className="capitalize">
            {s}
          </Badge>
        );
      },
    },
    {
      id: "qr_actions",
      header: "QR Self-Ordering",
      cell: ({ row }) => {
        const table = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedTableForQr(table)}
              className="h-7 text-xs gap-1 border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40"
            >
              <QrCode className="size-3.5" />
              <span>QR Code</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="h-7 px-2 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              <Link href={getTableQrUrl(table.id)} target="_blank" title="Launch Table QR View">
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Dining Tables & Customer QR"
          description="Manage dining tables, seating arrangements, and live customer self-ordering QR codes."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await q.refetch();
                  toast.success("Tables list updated");
                }}
                disabled={q.isFetching}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={`size-3.5 ${q.isFetching ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              <Button asChild className="bg-orange-600 hover:bg-orange-500 text-white gap-1.5">
                <Link href={`/branches/${branchId}/tables/new`}>
                  <Plus className="size-4" />
                  <span>New Table</span>
                </Link>
              </Button>
            </div>
          }
        />

        {q.isError ? (
          <ErrorState
            message={q.error ? String((q.error as Error).message) : "Failed to load"}
            onRetry={() => q.refetch()}
          />
        ) : null}

        {q.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-neutral-600 py-10">
            <Spinner className="size-4" />
            Loading tables…
          </div>
        ) : null}

        {!q.isLoading && !q.isError && rows.length === 0 ? (
          <EmptyState
            title="No tables found"
            description="Create your first dining table to start accepting dine-in guests and QR self-ordering."
          />
        ) : null}

        {!q.isLoading && !q.isError && rows.length > 0 ? (
          <DataTable data={rows} columns={columns} />
        ) : null}

        {/* High-Resolution Verified Scannable QR Code Dialog */}
        <TableQrDialog
          table={selectedTableForQr}
          branchId={branchId}
          open={!!selectedTableForQr}
          onOpenChange={(open) => {
            if (!open) setSelectedTableForQr(null);
          }}
        />
      </div>
    </PageContainer>
  );
}
