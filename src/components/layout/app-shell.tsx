import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({
  children,
  branchId,
}: {
  children: ReactNode;
  branchId?: string;
}) {
  return (
    <div className="flex min-h-[calc(100vh-0px)]">
      <Sidebar branchId={branchId} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar branchId={branchId} />
        <main className="flex-1 bg-neutral-50/40 dark:bg-neutral-950">{children}</main>
      </div>
    </div>
  );
}
