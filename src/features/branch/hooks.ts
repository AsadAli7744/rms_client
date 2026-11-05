"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchDiningTables,
  fetchFloors,
  fetchHalls,
  fetchReservations,
} from "@/features/branch/api";

export function useFloorsQuery(branchId: number, page = 1, limit = 50) {
  return useQuery({
    queryKey: ["floors", branchId, page, limit],
    queryFn: () => fetchFloors(branchId, { page, limit }),
    enabled: Number.isFinite(branchId),
  });
}

export function useHallsQuery(branchId: number, floorId?: number, page = 1, limit = 50) {
  return useQuery({
    queryKey: ["halls", branchId, floorId ?? "all", page, limit],
    queryFn: () => fetchHalls(branchId, { page, limit, floor_id: floorId }),
    enabled: Number.isFinite(branchId),
  });
}

export function useDiningTablesQuery(branchId: number) {
  return useQuery({
    queryKey: ["dining-tables", branchId],
    queryFn: () => fetchDiningTables(branchId),
    enabled: Number.isFinite(branchId),
  });
}

export function useReservationsQuery(branchId: number, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["reservations", branchId, page, limit],
    queryFn: () => fetchReservations(branchId, { page, limit }),
    enabled: Number.isFinite(branchId),
  });
}
