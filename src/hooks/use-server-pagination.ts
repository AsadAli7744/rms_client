"use client";

import { useMemo } from "react";

export function useServerPagination(
  page: number,
  limit: number,
  total: number,
) {
  return useMemo(() => {
    const pageCount = Math.max(1, Math.ceil(total / limit) || 1);
    const safePage = Math.min(Math.max(1, page), pageCount);
    const from = total === 0 ? 0 : (safePage - 1) * limit + 1;
    const to = Math.min(safePage * limit, total);
    return { pageCount, safePage, from, to };
  }, [page, limit, total]);
}
