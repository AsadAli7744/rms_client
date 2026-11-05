"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrders,
  fetchOrder,
  createOrder,
  updateOrderStatus,
  applyOrderDiscount,
  fetchDiningTables,
  fetchMenuItems,
} from "../orders/api";
import { useLiveOrders } from "../orders/use-live-orders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/feedback/spinner";
import {
  DollarSign,
  Printer,
  Plus,
  Percent,
  CheckCircle2,
  Clock,
  Utensils,
  CreditCard,
  Banknote,
  Smartphone,
  RefreshCw,
  Bell,
  Layers,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

export function CashierPageClient({
  branchId,
  restaurantId = 1,
}: {
  branchId: number;
  restaurantId?: number;
}) {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "queued" | "completed">("active");

  // Discount modal / inputs
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<string>("10");
  const [discountReason, setDiscountReason] = useState<string>("Manager Courtesy");

  // New Order / Queue Order Modal
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderTableId, setNewOrderTableId] = useState<number | null>(null);
  const [isQueueingNext, setIsQueueingNext] = useState(false);
  const [orderItemsCart, setOrderItemsCart] = useState<{ item_id: number; quantity: number }[]>([]);

  // Real-time Live Push Stream
  const { connected, lastNotification } = useLiveOrders({
    branchId,
    role: "cashier",
  });

  // Fetch orders
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["orders", branchId, activeTab],
    queryFn: () =>
      fetchOrders({
        branch_id: branchId,
        status:
          activeTab === "completed"
            ? "completed"
            : activeTab === "active"
              ? undefined
              : undefined,
        limit: 50,
      }),
  });

  // Fetch tables
  const { data: tables = [] } = useQuery({
    queryKey: ["dining-tables", branchId],
    queryFn: () => fetchDiningTables(branchId),
  });

  // Fetch menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ["menu-items", restaurantId],
    queryFn: () => fetchMenuItems(restaurantId),
  });

  // Currently selected order details
  const { data: selectedOrder } = useQuery({
    queryKey: ["order-detail", selectedOrderId],
    queryFn: () => (selectedOrderId ? fetchOrder(selectedOrderId) : null),
    enabled: Boolean(selectedOrderId),
  });

  // Mutations
  const discountMutation = useMutation({
    mutationFn: () =>
      applyOrderDiscount(selectedOrderId!, {
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        discount_reason: discountReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", branchId] });
      queryClient.invalidateQueries({ queryKey: ["order-detail", selectedOrderId] });
    },
  });

  const settleBillMutation = useMutation({
    mutationFn: (paymentMethod: string) =>
      updateOrderStatus(selectedOrderId!, {
        status: "completed" as any,
        payment_status: "paid" as any,
        payment_method: paymentMethod,
        paid_amount: selectedOrder?.total_amount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", branchId] });
      queryClient.invalidateQueries({ queryKey: ["order-detail", selectedOrderId] });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (input: any) => createOrder(input),
    onSuccess: () => {
      setShowNewOrderModal(false);
      setOrderItemsCart([]);
      queryClient.invalidateQueries({ queryKey: ["orders", branchId] });
    },
  });

  const allOrders = ordersData?.data ?? [];
  const filteredOrders = allOrders.filter((o) => {
    if (activeTab === "active") {
      return !["completed", "cancelled", "voided"].includes(o.status) && !o.is_queued;
    }
    if (activeTab === "queued") {
      return o.is_queued && !["completed", "cancelled"].includes(o.status);
    }
    if (activeTab === "completed") {
      return o.status === "completed";
    }
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Cashier Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Cashier & POS Management
          </h1>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span>{connected ? "Push Sync Connected" : "Connecting..."}</span>
            <span>•</span>
            <span>Branch #{branchId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setIsQueueingNext(false);
              setNewOrderTableId(null);
              setShowNewOrderModal(true);
            }}
            className="flex items-center gap-1.5 bg-neutral-900 text-xs text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            <Plus className="h-4 w-4" />
            + New Order / Walk-in
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Push Notification Bar */}
      {lastNotification && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <Bell className="h-4 w-4 text-amber-600 animate-bounce" />
          <span>{lastNotification}</span>
        </div>
      )}

      {/* Main Grid: Orders List & Bill Settlement */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Orders Column */}
        <div className="space-y-4 lg:col-span-7">
          {/* Tabs */}
          <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
            {(["active", "queued", "completed", "all"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === tab
                    ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                {tab === "active"
                  ? "Active Orders"
                  : tab === "queued"
                    ? "Queued Orders"
                    : tab}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {ordersLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card className="p-8 text-center text-xs text-neutral-500">
              No {activeTab} orders found for this branch.
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${
                      isSelected
                        ? "border-neutral-900 bg-neutral-50 shadow-xs dark:border-neutral-100 dark:bg-neutral-900"
                        : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {order.table ? `Table ${order.table.code}` : "Takeaway / QR"}
                        </span>
                        <Badge
                          variant={order.status === "ready" ? "default" : "outline"}
                          className="text-[10px] uppercase"
                        >
                          {order.status}
                        </Badge>
                        {order.is_queued && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                            Queued #{order.queue_number}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                        <span className="font-mono">#{order.order_number}</span>
                        <span>•</span>
                        <span>{order.items.length} items</span>
                        <span>•</span>
                        <span>{order.source}</span>
                        {order.discount_amount > 0 && (
                          <span className="font-medium text-amber-600">
                            (Discount -${order.discount_amount.toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        ${order.total_amount.toFixed(2)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                        {order.payment_status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Table Queue Action Box */}
          <Card className="p-4 bg-neutral-50 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Table Order Queue Controller
                </h4>
                <p className="text-xs text-neutral-500">
                  Customers scanning QR codes are restricted to 1 active order per table. Only Cashier or Manager can queue next orders.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsQueueingNext(true);
                  setShowNewOrderModal(true);
                }}
                className="text-xs"
              >
                + Queue Next Order for Table
              </Button>
            </div>
          </Card>
        </div>

        {/* Selected Order & Bill Settlement Column */}
        <div className="lg:col-span-5">
          {!selectedOrder ? (
            <Card className="flex h-96 flex-col items-center justify-center p-6 text-center text-neutral-400">
              <Utensils className="h-10 w-10 text-neutral-300" />
              <p className="mt-2 text-sm font-medium">Select an order to view bill & apply discounts</p>
            </Card>
          ) : (
            <Card className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {/* Order Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      Order #{selectedOrder.order_number}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {selectedOrder.table ? `Dining Table: ${selectedOrder.table.code}` : "Takeaway Order"}
                    </p>
                  </div>
                  <Badge className="uppercase text-xs">{selectedOrder.status}</Badge>
                </div>
              </div>

              {/* Items List */}
              <div className="max-h-56 overflow-y-auto p-4 space-y-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <div>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {item.quantity}x
                      </span>{" "}
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {item.item_name}
                      </span>
                      {item.variant_name && (
                        <span className="text-neutral-400"> ({item.variant_name})</span>
                      )}
                      {item.notes && (
                        <div className="text-[10px] text-amber-600">&gt; {item.notes}</div>
                      )}
                    </div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      ${item.subtotal.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Application Section */}
              <div className="p-4 space-y-3 bg-neutral-50 dark:bg-neutral-900/60">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-amber-600" /> Apply Discount
                  </span>
                  {selectedOrder.discount_amount > 0 && (
                    <span className="text-amber-600">
                      Current: -${selectedOrder.discount_amount.toFixed(2)} ({selectedOrder.discount_reason})
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="h-8 rounded border border-neutral-300 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="percentage">% Percent</option>
                    <option value="fixed">$ Fixed</option>
                  </select>

                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="Val"
                    className="h-8 w-20 text-xs"
                  />

                  <select
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="h-8 flex-1 rounded border border-neutral-300 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="Manager Courtesy">Manager Courtesy</option>
                    <option value="Staff Discount">Staff Discount</option>
                    <option value="Senior Citizen">Senior Citizen</option>
                    <option value="Loyalty Promo">Loyalty Promo</option>
                    <option value="Special Deal">Special Deal</option>
                  </select>

                  <Button
                    size="sm"
                    onClick={() => discountMutation.mutate()}
                    disabled={discountMutation.isPending}
                    className="h-8 text-xs bg-amber-600 text-white hover:bg-amber-700"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="p-4 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Discount ({selectedOrder.discount_reason || "Promo"}):</span>
                    <span>-${selectedOrder.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Tax (5%):</span>
                  <span>${selectedOrder.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-neutral-900 dark:text-neutral-100">
                  <span>Total Amount:</span>
                  <span>${selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Settlement Actions */}
              <div className="p-4 space-y-2">
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Select Payment Method & Settle:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => settleBillMutation.mutate("cash")}
                    disabled={settleBillMutation.isPending || selectedOrder.status === "completed"}
                    className="flex flex-col h-14 items-center justify-center gap-1 text-xs"
                  >
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    <span>Cash</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => settleBillMutation.mutate("card")}
                    disabled={settleBillMutation.isPending || selectedOrder.status === "completed"}
                    className="flex flex-col h-14 items-center justify-center gap-1 text-xs"
                  >
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span>Card</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => settleBillMutation.mutate("online")}
                    disabled={settleBillMutation.isPending || selectedOrder.status === "completed"}
                    className="flex flex-col h-14 items-center justify-center gap-1 text-xs"
                  >
                    <Smartphone className="h-4 w-4 text-purple-600" />
                    <span>Online/UPI</span>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New / Queue Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {isQueueingNext ? "Queue Next Order for Table" : "Create Manual Waiter / POS Order"}
            </h3>
            <p className="text-xs text-neutral-500">
              {isQueueingNext
                ? "As Cashier or Manager, this will be placed in the queue for the active table."
                : "Creates order and dispatches in real-time to Kitchen and Cashier screens."}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Select Dining Table:
                </label>
                <select
                  value={newOrderTableId ?? ""}
                  onChange={(e) => setNewOrderTableId(e.target.value ? Number(e.target.value) : null)}
                  className="mt-1 w-full rounded border border-neutral-300 bg-white p-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="">Takeaway / Walk-in (No Table)</option>
                  {tables.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      Table {t.code} ({t.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Add Items to Order:
                </label>
                <div className="mt-1 max-h-40 overflow-y-auto space-y-1 rounded border border-neutral-200 p-2 text-xs dark:border-neutral-800">
                  {menuItems.map((item: any) => {
                    const cartItem = orderItemsCart.find((c) => c.item_id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <span>
                          {item.name} (${Number(item.base_price).toFixed(2)})
                        </span>
                        <div className="flex items-center gap-1.5">
                          {cartItem && (
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">
                              {cartItem.quantity}
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0 text-xs"
                            onClick={() => {
                              setOrderItemsCart((prev) => {
                                const exist = prev.find((c) => c.item_id === item.id);
                                if (exist) {
                                  return prev.map((c) =>
                                    c.item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
                                  );
                                }
                                return [...prev, { item_id: item.id, quantity: 1 }];
                              });
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewOrderModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={orderItemsCart.length === 0 || createOrderMutation.isPending}
                onClick={() => {
                  createOrderMutation.mutate({
                    restaurant_id: restaurantId,
                    branch_id: branchId,
                    table_id: newOrderTableId,
                    source: "pos",
                    actor_role: "cashier",
                    is_queued: isQueueingNext,
                    items: orderItemsCart,
                  });
                }}
              >
                {isQueueingNext ? "Add to Queue" : "Submit Order"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
