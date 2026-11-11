"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchDiningTables,
  fetchFloors,
  fetchHalls,
  fetchReservations,
  type DiningTableRow,
  type FloorRow,
  type HallRow,
  type ReservationRow,
} from "@/features/branch/api";
import type { PaginatedResponse } from "@/lib/types/common";
import { getStoredCache, setStoredCache } from "@/lib/cache/browser-cache";

export function useFloorsQuery(branchId: number, page = 1, limit = 50) {
  const cacheKey = `floors:${branchId}:${page}:${limit}`;
  return useQuery({
    queryKey: ["floors", branchId, page, limit],
    queryFn: async () => {
      const data = await fetchFloors(branchId, { page, limit });
      setStoredCache(cacheKey, data);
      return data;
    },
    initialData: () => getStoredCache<PaginatedResponse<FloorRow>>(cacheKey) || undefined,
    enabled: Number.isFinite(branchId),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useHallsQuery(branchId: number, floorId?: number, page = 1, limit = 50) {
  const cacheKey = `halls:${branchId}:${floorId ?? "all"}:${page}:${limit}`;
  return useQuery({
    queryKey: ["halls", branchId, floorId ?? "all", page, limit],
    queryFn: async () => {
      const data = await fetchHalls(branchId, { page, limit, floor_id: floorId });
      setStoredCache(cacheKey, data);
      return data;
    },
    initialData: () => getStoredCache<PaginatedResponse<HallRow>>(cacheKey) || undefined,
    enabled: Number.isFinite(branchId),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useDiningTablesQuery(branchId: number) {
  const cacheKey = `dining-tables:${branchId}`;
  return useQuery({
    queryKey: ["dining-tables", branchId],
    queryFn: async () => {
      const data = await fetchDiningTables(branchId);
      setStoredCache(cacheKey, data);
      return data;
    },
    initialData: () => getStoredCache<DiningTableRow[]>(cacheKey) || undefined,
    enabled: Number.isFinite(branchId),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useReservationsQuery(branchId: number, page = 1, limit = 20) {
  const cacheKey = `reservations:${branchId}:${page}:${limit}`;
  return useQuery({
    queryKey: ["reservations", branchId, page, limit],
    queryFn: async () => {
      const data = await fetchReservations(branchId, { page, limit });
      setStoredCache(cacheKey, data);
      return data;
    },
    initialData: () => getStoredCache<PaginatedResponse<ReservationRow>>(cacheKey) || undefined,
    enabled: Number.isFinite(branchId),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
