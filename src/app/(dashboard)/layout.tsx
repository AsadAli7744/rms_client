import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { AppShellDynamic } from "@/components/layout/app-shell-dynamic";
import { Toaster } from "sonner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AppShellDynamic>{children}</AppShellDynamic>
      <Toaster richColors closeButton />
    </QueryProvider>
  );
}
