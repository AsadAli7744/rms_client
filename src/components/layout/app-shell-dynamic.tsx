"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export function AppShellDynamic({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, assignBranch } = useAuth();
  const match = pathname.match(/^\/branches\/(\d+)/);
  const branchId = match?.[1] ?? (user?.branch_id ? String(user.branch_id) : undefined);

  useEffect(() => {
    if (!user || user.role === "admin" || !user.restaurant_id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/branches/default");
        if (cancelled || !data?.id) return;
        if (user.branch_id !== data.id) {
          assignBranch({ id: data.id, name: data.name, code: data.code || "" });
        }
        const current = pathname.match(/^\/branches\/(\d+)/);
        if (current && Number(current[1]) !== data.id) {
          router.replace(pathname.replace(`/branches/${current[1]}`, `/branches/${data.id}`));
        }
      } catch {
        // Leave the current page if the branch lookup fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, assignBranch, pathname, router]);

  return <AppShell branchId={branchId}>{children}</AppShell>;
}
