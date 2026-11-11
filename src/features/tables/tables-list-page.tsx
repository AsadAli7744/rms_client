"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Spinner } from "@/components/feedback/spinner";
import { useDiningTablesQuery } from "@/features/branch/hooks";
import type { DiningTableRow } from "@/features/branch/api";
import { QrCode, ExternalLink, Copy, Check, Plus, Users, Utensils } from "lucide-react";
import { toast } from "sonner";

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
            <Button asChild className="bg-orange-600 hover:bg-orange-500 text-white gap-1.5">
              <Link href={`/branches/${branchId}/tables/new`}>
                <Plus className="size-4" />
                <span>New Table</span>
              </Link>
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

        {/* QR Code Inspection Modal */}
        {selectedTableForQr && (
          <Dialog open={!!selectedTableForQr} onOpenChange={() => setSelectedTableForQr(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <QrCode className="size-5 text-orange-500" />
                  <span>Table QR Code — {selectedTableForQr.name || `Table ${selectedTableForQr.code}`}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-3">
                <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-center">
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-neutral-200 mb-3">
                    <QrCode className="size-32 text-neutral-900" />
                  </div>
                  <span className="font-mono font-bold text-lg text-neutral-900 dark:text-white">
                    {selectedTableForQr.code}
                  </span>
                  <span className="text-xs text-neutral-500 mt-0.5">
                    Capacity: {selectedTableForQr.seating_capacity} Guests • Status: {selectedTableForQr.status}
                  </span>
                </div>

                <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-1 bg-white dark:bg-neutral-950">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                    Direct Customer Ordering URL
                  </span>
                  <p className="font-mono text-xs text-neutral-700 dark:text-neutral-300 break-all select-all">
                    {getTableQrUrl(selectedTableForQr.id)}
                  </p>
                </div>
              </div>

              <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyTableLink(selectedTableForQr.id)}
                  className="gap-1.5 text-xs"
                >
                  {copiedLink ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  <span>{copiedLink ? "Copied Link!" : "Copy URL"}</span>
                </Button>

                <Button
                  size="sm"
                  asChild
                  className="bg-orange-600 hover:bg-orange-500 text-white gap-1.5 text-xs"
                >
                  <Link href={getTableQrUrl(selectedTableForQr.id)} target="_blank">
                    <ExternalLink className="size-3.5" />
                    <span>Launch Ordering View</span>
                  </Link>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </PageContainer>
  );
}
