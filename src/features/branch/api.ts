import { api } from "@/lib/api/client";
import type { PaginatedResponse } from "@/lib/types/common";
import { buildQueryString } from "@/lib/utils/query-string";
import { invalidateStoredCache } from "@/lib/cache/browser-cache";

export type FloorRow = {
  id: number;
  branch_id: number;
  name: string;
  code: string | null;
  sort_order: number;
  is_active: boolean;
};

export type HallRow = {
  id: number;
  branch_id: number;
  floor_id: number;
  name: string;
  code: string | null;
  sort_order: number;
  is_active: boolean;
};

export type DiningTableRow = {
  id: number;
  branch_id: number;
  code: string;
  name: string | null;
  floor: string | null;
  section: string | null;
  floor_id: number | null;
  hall_id: number | null;
  seating_capacity: number;
  status: string;
};

export type ReservationRow = {
  id: number;
  branch_id: number;
  customer_name: string;
  customer_phone: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  status: string;
};

export async function fetchFloors(branchId: number, params?: { page?: number; limit?: number }) {
  const qs = buildQueryString({
    page: params?.page ?? 1,
    limit: params?.limit ?? 50,
  });
  const { data } = await api.get<PaginatedResponse<FloorRow>>(
    `/branches/${branchId}/floors${qs}`,
  );
  return data;
}

export async function fetchHalls(
  branchId: number,
  params?: { page?: number; limit?: number; floor_id?: number },
) {
  const qs = buildQueryString({
    page: params?.page ?? 1,
    limit: params?.limit ?? 50,
    floor_id: params?.floor_id,
  });
  const { data } = await api.get<PaginatedResponse<HallRow>>(
    `/branches/${branchId}/halls${qs}`,
  );
  return data;
}

export async function fetchDiningTables(branchId: number) {
  const { data } = await api.get<DiningTableRow[]>(`/branches/${branchId}/tables`);
  return data;
}

export async function fetchReservations(
  branchId: number,
  params?: { page?: number; limit?: number; date_from?: string; date_to?: string },
) {
  const qs = buildQueryString({
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    date_from: params?.date_from,
    date_to: params?.date_to,
  });
  const { data } = await api.get<PaginatedResponse<ReservationRow>>(
    `/branches/${branchId}/reservations${qs}`,
  );
  return data;
}

export async function createFloor(branchId: number, body: {
  name: string;
  code?: string | null;
  sort_order?: number;
  is_active?: boolean;
}) {
  const { data } = await api.post<FloorRow>(`/branches/${branchId}/floors`, body);
  invalidateStoredCache(`floors:${branchId}`);
  return data;
}

export async function createHall(branchId: number, body: {
  floor_id: number;
  name: string;
  code?: string | null;
  sort_order?: number;
  is_active?: boolean;
}) {
  const { data } = await api.post<HallRow>(`/branches/${branchId}/halls`, body);
  invalidateStoredCache(`halls:${branchId}`);
  return data;
}

export async function createDiningTable(
  branchId: number,
  body: {
    code: string;
    name?: string | null;
    seating_capacity?: number;
    floor_id?: number | null;
    hall_id?: number | null;
    floor?: string | null;
    section?: string | null;
  },
) {
  const { data } = await api.post<DiningTableRow>(`/branches/${branchId}/tables`, body);
  invalidateStoredCache(`dining-tables:${branchId}`);
  return data;
}
