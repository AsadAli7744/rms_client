"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { BranchRow } from "@/features/branches/api";

export const branchColumns: ColumnDef<BranchRow>[] = [
  { header: "Name", accessorKey: "name" },
  { header: "Code", accessorKey: "code" },
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
    header: "",
    id: "actions",
    cell: ({ row }) => (
      <Link
        className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100"
        href={`/branches/${row.original.id}/floors`}
      >
        Open
      </Link>
    ),
  },
];
