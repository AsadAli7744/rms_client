"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchKitchenTickets,
  updateKitchenItemStatus,
  updateOrderStatus,
  markOrderPrinted,
} from "../orders/api";
import { useLiveOrders, printThermalReceipt } from "../orders/use-live-orders";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/feedback/spinner";
import {
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  UtensilsCrossed,
  RotateCw,
  Sparkles,
  ShoppingBag,
  Bike,
  QrCode,
  ChefHat,
} from "lucide-react";

/**
 * Human-friendly elapsed time formatter.
 * Converts raw minutes into clean durations (e.g., "< 1m", "15m", "2h 10m", "6d 4h").
 */
function formatElapsedTime(minutes: number): string {
  if (minutes < 1) return "< 1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours < 24) return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const dayRemHours = hours % 24;
  return dayRemHours > 0 ? `${days}d ${dayRemHours}h` : `${days}d`;
}

/**
 * Determine display title and icon based on table, fulfillment type, and order source.
 */
function getOrderHeader(order: any) {
  if (order.table?.code) {
    return {
      title: `Table ${order.table.code}`,
      icon: UtensilsCrossed,
    };
  }
  const fulfillment = (order.fulfillment_type || "").toLowerCase();
  if (fulfillment === "takeaway") {
    return {
      title: "Takeaway",
      icon: ShoppingBag,
    };
  }
  if (fulfillment === "delivery") {
    return {
      title: "Delivery",
      icon: Bike,
    };
  }
  if (order.source?.toLowerCase().includes("qr")) {
    return {
      title: "QR Dine-In",
      icon: QrCode,
    };
  }
  return {
    title: "Takeaway / POS",
    icon: ShoppingBag,
  };
}

const STATION_OPTIONS = [
  { value: "all", label: "All Stations" },
  { value: "kitchen", label: "Kitchen / Grill" },
  { value: "bar", label: "Bar & Drinks" },
  { value: "dessert", label: "Dessert" },
  { value: "counter", label: "Counter" },
];

export function KitchenPageClient({ branchId }: { branchId: number }) {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [stationFilter, setStationFilter] = useState<string>("all");
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(true);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("rms_auto_print_kitchen");
    if (stored !== null) {
      setAutoPrintEnabled(stored === "true");
    }
  }, []);

  // Persist auto-print preference
  const toggleAutoPrint = () => {
    const next = !autoPrintEnabled;
    setAutoPrintEnabled(next);
    localStorage.setItem("rms_auto_print_kitchen", String(next));
    toast.success(`Thermal auto-print turned ${next ? "ON" : "OFF"}`);
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
      toast.success("Order marked Ready for pickup/serving");
    },
  });

  // Mutation to mark order served (completes ticket and archives it from active KDS)
  const orderServedMutation = useMutation({
    mutationFn: (orderId: number) =>
      updateOrderStatus(orderId, { status: "served" as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-tickets", branchId] });
      toast.success("Order marked Served and cleared from board");
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
      toast.success("Sent ticket to thermal printer");
    },
  });

  return (
    <div className="min-h-screen space-y-6 bg-neutral-900 p-4 sm:p-6 text-white">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:flex-row sm:items-center sm:justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Kitchen Display System (KDS)
            </h1>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  mounted && connected ? "bg-emerald-500 animate-pulse" : "bg-neutral-600"
                }`}
              />
              <span suppressHydrationWarning>
                {mounted && connected ? "Live Push Active" : "Connecting..."}
              </span>
              <span>•</span>
              <span>Branch #{branchId}</span>
              <span>•</span>
              <span className="font-semibold text-neutral-300">
                {tickets.length} {tickets.length === 1 ? "Active Ticket" : "Active Tickets"}
              </span>
            </div>
          </div>
        </div>

        {/* Printer & Audio Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Thermal Auto-Print Toggle */}
          <button
            type="button"
            onClick={toggleAutoPrint}
            suppressHydrationWarning
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              mounted && autoPrintEnabled
                ? "border-emerald-600/80 bg-emerald-950/60 text-emerald-300 shadow-sm"
                : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            <Printer className="h-4 w-4" />
            <span suppressHydrationWarning>
              Thermal Auto-Print:{" "}
              <strong>{mounted ? (autoPrintEnabled ? "ON" : "OFF") : "ON"}</strong>
            </span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await refetch();
              toast.success("Kitchen tickets refreshed");
            }}
            disabled={isFetching}
            className="border-neutral-700 bg-neutral-900 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white gap-1.5 h-8"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Station Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {STATION_OPTIONS.map((st) => (
          <button
            key={st.value}
            type="button"
            onClick={() => setStationFilter(st.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              stationFilter === st.value
                ? "bg-orange-600 text-white shadow-md shadow-orange-950/50"
                : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Live Notification Banner */}
      {lastNotification && (
        <div className="flex items-center justify-between rounded-lg border border-amber-600/40 bg-amber-950/60 px-4 py-2.5 text-sm text-amber-200">
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 animate-bounce text-amber-400 shrink-0" />
            <span className="font-medium">{lastNotification}</span>
          </div>
          <span className="text-xs text-amber-400/80 shrink-0">Real-time alert</span>
        </div>
      )}

      {/* Kitchen Order Tickets Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-neutral-400" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 p-16 text-center">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-neutral-600" />
          <h3 className="mt-3 text-base font-semibold text-neutral-300">
            All kitchen tickets completed!
          </h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
            New orders from Table QR codes, Waiters, or the POS counter will automatically pop up here with live sound alerts and thermal printing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-5">
          {tickets.map((order) => {
            const elapsed = order.elapsed_minutes ?? 0;
            const isUrgent = elapsed >= 15;
            const isMedium = elapsed >= 8 && elapsed < 15;
            const isReady = order.status === "ready";
            const totalItems = order.items.length;
            const readyItems = order.items.filter((i: any) => i.status === "ready").length;
            const allItemsReady = totalItems > 0 && readyItems === totalItems;
            const headerInfo = getOrderHeader(order);
            const HeaderIcon = headerInfo.icon;

            return (
              <div
                key={order.id}
                className={`relative flex flex-col justify-between rounded-xl border bg-neutral-950 p-4 sm:p-5 shadow-lg transition-all duration-200 overflow-hidden ${
                  isReady
                    ? "border-emerald-500/70 bg-emerald-950/15 shadow-emerald-950/30"
                    : isUrgent
                      ? "border-red-500/80 bg-red-950/10 shadow-[0_0_20px_rgba(239,68,68,0.12)] ring-1 ring-red-500/30"
                      : isMedium
                        ? "border-amber-500/70 bg-amber-950/10 shadow-amber-950/20"
                        : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {/* Top Accent Indicator Bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isReady
                      ? "bg-emerald-500"
                      : isUrgent
                        ? "bg-red-500"
                        : isMedium
                          ? "bg-amber-500"
                          : "bg-neutral-700"
                  }`}
                />

                <div>
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-neutral-800/80 pb-3 pt-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-orange-400">
                          <HeaderIcon className="h-4 w-4" />
                        </span>
                        <span className="truncate text-base font-bold text-white tracking-tight">
                          {headerInfo.title}
                        </span>
                        {order.is_queued && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 bg-purple-900/60 text-purple-300 border border-purple-700/40 text-[11px] font-semibold"
                          >
                            #{order.queue_number}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1.5 flex items-center gap-2 text-xs font-mono">
                        <span className="whitespace-nowrap font-medium text-neutral-300">
                          #{order.order_number}
                        </span>
                        {order.customer_name && (
                          <>
                            <span className="text-neutral-600">•</span>
                            <span className="truncate font-sans text-neutral-300">
                              {order.customer_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Timer & Source Badge */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-tight ${
                          isUrgent
                            ? "bg-red-950/90 text-red-400 border border-red-800/60 shadow-sm"
                            : isMedium
                              ? "bg-amber-950/90 text-amber-400 border border-amber-800/60"
                              : "bg-neutral-800/90 text-neutral-300 border border-neutral-700/60"
                        }`}
                      >
                        <Clock className={`h-3.5 w-3.5 ${isUrgent ? "animate-pulse" : ""}`} />
                        <span>{formatElapsedTime(elapsed)}</span>
                      </div>
                      <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border border-neutral-800">
                        {order.source?.replace("_", " ") || "POS"}
                      </span>
                    </div>
                  </div>

                  {/* Special Order Notes */}
                  {order.notes && (
                    <div className="mt-3 rounded-lg border border-amber-900/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
                      <strong className="text-amber-400">Order Note:</strong> {order.notes}
                    </div>
                  )}

                  {/* Order Items List */}
                  <div className="mt-3 divide-y divide-neutral-800/70">
                    {order.items.map((item: any) => {
                      const isItemReady = item.status === "ready";
                      const isItemPrep = item.status === "in_preparation";

                      return (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-3 py-2.5 transition-colors"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {/* Quantity Badge */}
                            <span
                              className={`inline-flex h-6 min-w-[26px] shrink-0 items-center justify-center rounded px-1.5 text-xs font-bold tracking-tight ${
                                isItemReady
                                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {item.quantity}×
                            </span>

                            {/* Name & Details */}
                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-sm font-medium leading-snug break-words ${
                                  isItemReady
                                    ? "line-through text-neutral-500"
                                    : "text-neutral-100"
                                }`}
                              >
                                <span>{item.item_name}</span>
                                {item.variant_name && (
                                  <span className="ml-1.5 text-xs text-neutral-400 font-normal">
                                    ({item.variant_name})
                                  </span>
                                )}
                              </div>

                              {item.notes && (
                                <div className="mt-1 flex items-center gap-1.5 rounded border border-amber-900/40 bg-amber-950/40 px-2 py-0.5 text-[11px] text-amber-300">
                                  <AlertCircle className="h-3 w-3 shrink-0 text-amber-400" />
                                  <span className="truncate">{item.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Interactive Status Pill Button */}
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
                            title="Click to advance status"
                            className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition border ${
                              isItemReady
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/70"
                                : isItemPrep
                                  ? "bg-amber-950/80 text-amber-300 border-amber-600/60 hover:bg-amber-900/70 shadow-sm"
                                  : "bg-neutral-900 text-neutral-400 border-neutral-700/80 hover:text-neutral-200 hover:border-neutral-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isItemReady
                                  ? "bg-emerald-400"
                                  : isItemPrep
                                    ? "bg-amber-400 animate-ping"
                                    : "bg-neutral-500"
                              }`}
                            />
                            <span>
                              {isItemPrep
                                ? "Cooking"
                                : isItemReady
                                  ? "Ready"
                                  : "Queued"}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Footer Actions */}
                <div className="mt-4 border-t border-neutral-800/80 pt-3">
                  {/* Item Preparation Progress */}
                  <div className="mb-2.5 flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-medium">
                      Progress:{" "}
                      <strong
                        className={
                          allItemsReady ? "text-emerald-400" : "text-neutral-200"
                        }
                      >
                        {readyItems}/{totalItems} items ready
                      </strong>
                    </span>
                    {allItemsReady && !isReady && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <Sparkles className="h-3 w-3" /> Ready to serve
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printMutation.mutate(order)}
                      disabled={printMutation.isPending}
                      className="flex-1 border-neutral-700 bg-neutral-900/90 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white h-9"
                      title="Print ticket on thermal printer"
                    >
                      <Printer className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                      {order.printed_at ? "Reprint" : "Print Ticket"}
                    </Button>

                    {isReady ? (
                      <Button
                        size="sm"
                        onClick={() => orderServedMutation.mutate(order.id)}
                        disabled={orderServedMutation.isPending}
                        className="flex-1 bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-sm h-9"
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Mark Served
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => orderReadyMutation.mutate(order.id)}
                        disabled={orderReadyMutation.isPending}
                        className={`flex-1 text-xs font-bold text-white shadow-sm transition h-9 ${
                          allItemsReady
                            ? "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/40"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Mark Ready
                      </Button>
                    )}
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
