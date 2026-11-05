"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function DataTable<T>({
  data,
  columns,
  getRowId,
  enableRowSelection,
}: {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId?: (row: T, index: number) => string;
  enableRowSelection?: boolean;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: !!enableRowSelection,
    getRowId: getRowId
      ? (row, index) => getRowId(row as T, index)
      : undefined,
  });

  const headerGroups = useMemo(() => table.getHeaderGroups(), [table]);

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900/40">
          {headerGroups.map((hg) => (
            <tr key={hg.id} className="border-b border-neutral-200 dark:border-neutral-800">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300",
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                className="px-3 py-8 text-center text-sm text-neutral-500"
                colSpan={columns.length}
              >
                No rows
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
