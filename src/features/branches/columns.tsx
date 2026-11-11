"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import type { BranchRow } from "@/features/branches/api";

export function getBranchColumns(options?: {
  isAdmin?: boolean;
  onEdit?: (branch: BranchRow) => void;
  onArchive?: (branch: BranchRow) => void;
}): ColumnDef<BranchRow>[] {
  const cols: ColumnDef<BranchRow>[] = [
    { header: "Name", accessorKey: "name" },
    {
      header: "Code",
      accessorKey: "code",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
          {String(getValue())}
        </span>
      ),
    },
    { header: "City", accessorKey: "city" },
    {
      header: "Status",
      accessorKey: "branch_status",
      cell: ({ getValue }) => {
        const v = String(getValue());
        const variant =
          v === "active" ? "success" : v === "inactive" ? "secondary" : "warning";
        return <Badge variant={variant}>{v}</Badge>;
      },
    },
    {
      header: "Operations",
      id: "operations",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            className="text-xs font-semibold text-orange-600 hover:text-orange-500 underline-offset-4 hover:underline"
            href={`/branches/${row.original.id}/item-sales`}
          >
            Sales & Reports
          </Link>
          <span className="text-neutral-400">·</span>
          <Link
            className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            href={`/branches/${row.original.id}/cashier`}
          >
            POS
          </Link>
          <span className="text-neutral-400">·</span>
          <Link
            className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            href={`/branches/${row.original.id}/kitchen`}
          >
            KDS
          </Link>
        </div>
      ),
    },
  ];

  if (options?.isAdmin) {
    cols.push({
      header: "Admin Actions",
      id: "adminActions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {options.onEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-neutral-600 dark:text-neutral-300 hover:text-white"
              onClick={() => options.onEdit!(row.original)}
            >
              <Edit2 className="size-3.5 mr-1 text-blue-400" />
              <span>Edit</span>
            </Button>
          )}
          {options.onArchive && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => options.onArchive!(row.original)}
            >
              <Trash2 className="size-3.5 mr-1 text-red-400" />
              <span>Archive</span>
            </Button>
          )}
        </div>
      ),
    });
  }

  return cols;
}

export const branchColumns = getBranchColumns();
