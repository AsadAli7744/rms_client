"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { BranchRow } from "@/features/branches/api";

export const branchColumns: ColumnDef<BranchRow>[] = [
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
    id: "actions",
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
