import type { ReactNode } from "react";
import { AppShellDynamic } from "@/components/layout/app-shell-dynamic";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShellDynamic>{children}</AppShellDynamic>;
}
