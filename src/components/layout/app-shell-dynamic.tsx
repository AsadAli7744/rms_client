"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export function AppShellDynamic({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const match = pathname.match(/^\/branches\/(\d+)/);
  const branchId = match?.[1];
  return <AppShell branchId={branchId}>{children}</AppShell>;
}
