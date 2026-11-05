"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBranches } from "@/features/branches/api";

export function useBranchesQuery(params: {
  page: number;
  limit: number;
  restaurant_id?: number;
  q?: string;
}) {
  return useQuery({
    queryKey: ["branches", params],
    queryFn: () => fetchBranches(params),
  });
}
