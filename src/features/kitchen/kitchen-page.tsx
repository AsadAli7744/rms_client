"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchKitchenTickets, updateKitchenItemStatus, updateOrderStatus, markOrderPrinted } from "../orders/api";
import { useLiveOrders, printThermalReceipt } from "../orders/use-live-orders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/feedback/spinner";
import {
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Volume2,
  UtensilsCrossed,
  RotateCw,
  Sparkles,
} from "lucide-react";

export function KitchenPageClient({ branchId }: { branchId: number }) {
  const queryClient = useQueryClient();
  const [stationFilter, setStationFilter] = useState<string>("all");
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rms_auto_print_kitchen") === "true";
    }
    return true;
  });

  // Persist auto-print preference
  const toggleAutoPrint = () => {
    const next = !autoPrintEnabled;
    setAutoPrintEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("rms_auto_print_kitchen", String(next));
    }
  };

  // Connect to Live SSE push stream
  const { connected, lastNotification } = useLiveOrders({
    branchId,
    role: "kitchen",
    autoPrintKitchen: autoPrintEnabled,
  });

  // Query active kitchen tickets
  const {
    data: tickets = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["kitchen-tickets", branchId, stationFilter],
    queryFn: () =>
      fetchKitchenTickets(
        branchId,
        stationFilter === "all" ? undefined : stationFilter,
      ),
    refetchInterval: 10_000, // safety fallback poll
  });

  // Mutation to advance item status
  const itemStatusMutation = useMutation({
    mutationFn: ({ itemId, status }: { itemId: number; status: string }) =>
      updateKitchenItemStatus(itemId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-tickets", branchId] });
    },
  });

  // Mutation to mark order ready
  const orderReadyMutation = useMutation({
    mutationFn: (orderId: number) =>
      updateOrderStatus(orderId, { status: "ready" as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-tickets", branchId] });
    },
  });

  // Mutation to record print
  const printMutation = useMutation({
    mutationFn: (order: any) => {
      printThermalReceipt(order);
      return markOrderPrinted(order.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-tickets", branchId] });
    },
  });

  return (
    <div className="min-h-screen space-y-6 bg-neutral-900 p-6 text-white">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600/20 text-orange-400">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Kitchen Display System (KDS)
            </h1>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span>{connected ? "Live Real-Time Sync Active" : "Connecting..."}</span>
              <span>•</span>
              <span>Branch #{branchId}</span>
            </div>
          </div>
        </div>

        {/* Printer & Audio Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Thermal Auto-Print Toggle */}
          <button
            type="button"
            onClick={toggleAutoPrint}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              autoPrintEnabled
                ? "border-emerald-600 bg-emerald-950/60 text-emerald-300"
                : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            <Printer className="h-4 w-4" />
            <span>
              Auto-Print Thermal Printer:{" "}
              <strong>{autoPrintEnabled ? "ON" : "OFF"}</strong>
            </span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-800"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Notification Banner */}
      {lastNotification && (
        <div className="flex items-center justify-between rounded-lg border border-amber-600/40 bg-amber-950/60 px-4 py-2 text-sm text-amber-200">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 animate-bounce text-amber-400" />
            <span>{lastNotification}</span>
          </div>
          <span className="text-xs text-amber-400/80">Received via real-time push</span>
        </div>
      )}

      {/* Kitchen Order Tickets Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-neutral-400" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 p-16 text-center">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-neutral-600" />
          <h3 className="mt-3 text-base font-semibold text-neutral-300">
            All tickets completed!
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            New orders from QR scanning or Waiters will automatically appear here and trigger thermal printing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tickets.map((order) => {
            const elapsed = order.elapsed_minutes ?? 0;
            const isUrgent = elapsed >= 15;
            const isMedium = elapsed >= 8 && elapsed < 15;

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-xl border bg-neutral-950 p-4 shadow-md transition ${
                  order.status === "ready"
                    ? "border-emerald-600/50 bg-emerald-950/20"
                    : isUrgent
                      ? "border-red-600/70"
                      : isMedium
                        ? "border-amber-600/60"
                        : "border-neutral-800"
                }`}
              >
                <div>
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {order.table ? `Table ${order.table.code}` : "Takeaway / QR"}
                        </span>
                        {order.is_queued && (
                          <Badge variant="secondary" className="bg-purple-900/60 text-purple-300">
                            Queued #{order.queue_number}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs font-mono text-neutral-400">
                        #{order.order_number}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${
                          isUrgent
                            ? "bg-red-950 text-red-400"
                            : isMedium
                              ? "bg-amber-950 text-amber-400"
                              : "bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        <span>{elapsed}m</span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-neutral-500 uppercase">
                        {order.source}
                      </div>
                    </div>
                  </div>

                  {/* Special Order Notes */}
                  {order.notes && (
                    <div className="mt-2 rounded bg-amber-950/60 p-2 text-xs text-amber-200">
                      <strong>Note:</strong> {order.notes}
                    </div>
                  )}

                  {/* Order Items List */}
                  <div className="mt-3 divide-y divide-neutral-850">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div className="pr-2">
                          <div className="font-semibold text-white">
                            <span className="mr-1.5 inline-block rounded bg-neutral-800 px-1.5 py-0.5 text-xs font-bold text-orange-400">
                              {item.quantity}x
                            </span>
                            {item.item_name}
                            {item.variant_name && (
                              <span className="ml-1 text-xs text-neutral-400">
                                ({item.variant_name})
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-amber-400/80">
                              &gt;&gt; {item.notes}
                            </div>
                          )}
                        </div>

                        {/* Item status toggle button */}
                        <button
                          type="button"
                          onClick={() => {
                            const next =
                              item.status === "queued"
                                ? "in_preparation"
                                : item.status === "in_preparation"
                                  ? "ready"
                                  : "queued";
                            itemStatusMutation.mutate({
                              itemId: item.id,
                              status: next,
                            });
                          }}
                          className={`shrink-0 rounded px-2 py-1 text-xs font-medium uppercase tracking-wider transition ${
                            item.status === "ready"
                              ? "bg-emerald-900/60 text-emerald-300"
                              : item.status === "in_preparation"
                                ? "bg-amber-900/60 text-amber-300"
                                : "bg-neutral-800 text-neutral-400 hover:text-white"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ticket Footer Actions */}
                <div className="mt-4 border-t border-neutral-800 pt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printMutation.mutate(order)}
                      className="flex-1 border-neutral-700 bg-neutral-900 text-xs text-neutral-200 hover:bg-neutral-800"
                      title="Print ticket on thermal printer"
                    >
                      <Printer className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                      {order.printed_at ? "Reprint" : "Print Ticket"}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => orderReadyMutation.mutate(order.id)}
                      className="flex-1 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Mark Ready
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
