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

export type CreateBranchPayload = {
  restaurant_id: number;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state?: string | null;
  country: string;
  postal_code?: string | null;
  branch_status?: string;
  dine_in_enabled?: boolean;
  pickup_enabled?: boolean;
  delivery_enabled?: boolean;
  online_ordering_enabled?: boolean;
};

export async function createBranch(payload: CreateBranchPayload) {
  const { data } = await api.post<BranchRow>("/branches", payload);
  return data;
}

export async function updateBranch(id: number, payload: Partial<CreateBranchPayload>) {
  const { data } = await api.patch<BranchRow>(`/branches/${id}`, payload);
  return data;
}

export async function archiveBranch(id: number) {
  const { data } = await api.post<BranchRow>(`/branches/${id}/archive`);
  return data;
}

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
