import { api } from "@/lib/api/client";
import type { PaginatedResponse } from "@/lib/types/common";
import { buildQueryString } from "@/lib/utils/query-string";

export type BranchRow = {
  id: number;
  restaurant_id: number;
  name: string;
  code: string;
  branch_status: string;
  city: string;
  country: string;
  online_ordering_enabled: boolean;
};

export async function fetchBranches(params: {
  page?: number;
  limit?: number;
  restaurant_id?: number;
  q?: string;
}) {
  const qs = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    restaurant_id: params.restaurant_id,
    q: params.q,
  });
  const { data } = await api.get<PaginatedResponse<BranchRow>>(`/branches${qs}`);
  return data;
}
