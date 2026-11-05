"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Minimal URL query helpers for list screens (page, limit, q, custom keys).
 */
export function useQueryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const snapshot = useMemo(() => Object.fromEntries(sp.entries()), [sp]);

  const setParams = useCallback(
    (patch: Record<string, string | number | boolean | null | undefined>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === "") {
          next.delete(k);
        } else {
          next.set(k, String(v));
        }
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, sp],
  );

  return { snapshot, setParams, searchParams: sp };
}
