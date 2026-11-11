"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useRestaurantCurrency } from "@/hooks/use-restaurant-currency";
import {
  fetchOrders,
  fetchOrder,
  createOrder,
  updateOrderStatus,
  applyOrderDiscount,
  cancelOrder,
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
  Truck,
  MapPin,
  Phone,
  User,
  XCircle,
  Package,
  ShoppingBag,
} from "lucide-react";

export function CashierPageClient({
  branchId,
  restaurantId = 1,
}: {
  branchId: number;
  restaurantId?: number;
}) {
  const queryClient = useQueryClient();

  // Fetch branch details to dynamically resolve restaurant
  const { data: branchData } = useQuery({
    queryKey: ["branch", branchId],
    queryFn: async () => {
      const { data } = await api.get(`/branches/${branchId}`);
      return data;
    },
    enabled: Boolean(branchId),
  });

  const effectiveRestaurantId = branchData?.restaurant_id || restaurantId;
  const { symbol: currencySymbol, format: formatMoney } = useRestaurantCurrency(effectiveRestaurantId);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    "active" | "queued" | "delivery" | "completed" | "cancelled" | "all"
  >("active");

  // Discount modal / inputs
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<string>("10");
  const [discountReason, setDiscountReason] = useState<string>("Manager Courtesy");

  // Cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonPreset, setCancelReasonPreset] = useState("Customer changed mind");
  const [customCancelReason, setCustomCancelReason] = useState("");

  // New Order / Queue Order Modal
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [orderFulfillment, setOrderFulfillment] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [newOrderTableId, setNewOrderTableId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState<string>("3.00");
  const [orderNotes, setOrderNotes] = useState("");
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
        limit: 100,
      }),
  });

  // Fetch tables
  const { data: tables = [] } = useQuery({
    queryKey: ["dining-tables", branchId],
    queryFn: () => fetchDiningTables(branchId),
  });

  // Fetch menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ["menu-items", effectiveRestaurantId],
    queryFn: () => fetchMenuItems(effectiveRestaurantId),
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
      toast.success("Discount applied successfully");
      queryClient.invalidateQueries({ queryKey: ["orders", branchId] });
      queryClient.invalidateQueries({ queryKey: ["order-detail", selectedOrderId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to apply discount");
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
      toast.success("Bill settled and marked Completed!");
      queryClient.invalidateQueries({ queryKey: ["orders", branchId] });
      queryClient.invalidateQueries({ queryKey: ["order-detail", selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ["dining-tables", branchId] });
    },
  });

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: (status: "out_for_delivery" | "delivered") =>
      updateOrderStatus(selectedOrderId!, {
        status: status as any,
      }),
    onSuccess: (_, status) => {
      toast.success(`Order status updated to ${status.replace(/_/g, " ").toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ["orders", branchId] });
      queryClient.invalidateQueries({ queryKey: ["order-detail", selectedOrderId] });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (reason: string) => cancelOrder(selectedOrderId!, reason),
    onSuccess: () => {
      toast.success("Order cancelled and stock restored to inventory!");
      setShowCancelModal(false);
      setCustomCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["orders", branchId] });
      queryClient.invalidateQueries({ queryKey: ["order-detail", selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ["dining-tables", branchId] });
      queryClient.invalidateQueries({ queryKey: ["menu-items", restaurantId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (input: any) => createOrder(input),
    onSuccess: (newOrder) => {
      toast.success(`Order #${newOrder.order_number} created successfully!`);
      setShowNewOrderModal(false);
      setOrderItemsCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDeliveryAddress("");
      setOrderNotes("");
      queryClient.invalidateQueries({ queryKey: ["orders", branchId] });
      queryClient.invalidateQueries({ queryKey: ["dining-tables", branchId] });
      queryClient.invalidateQueries({ queryKey: ["menu-items", restaurantId] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to create order";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
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
    if (activeTab === "delivery") {
      return o.fulfillment_type === "delivery" && !["cancelled"].includes(o.status);
    }
    if (activeTab === "completed") {
      return o.status === "completed";
    }
    if (activeTab === "cancelled") {
      return o.status === "cancelled";
    }
    return true;
  });

  const handleCreateOrderSubmit = () => {
    if (orderItemsCart.length === 0) {
      toast.error("Please add at least one item to the cart");
      return;
    }

    if (orderFulfillment === "delivery" && !deliveryAddress.trim()) {
      toast.error("Delivery address is required for Home Delivery");
      return;
    }

    const payload: any = {
      restaurant_id: restaurantId,
      branch_id: branchId,
      table_id: orderFulfillment === "dine_in" ? newOrderTableId : null,
      fulfillment_type: orderFulfillment,
      delivery_address: orderFulfillment === "delivery" ? deliveryAddress : null,
      delivery_fee: orderFulfillment === "delivery" ? parseFloat(deliveryFee) || 0 : 0,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      notes: orderNotes || null,
      source: "pos",
      actor_role: "cashier",
      is_queued: isQueueingNext,
      items: orderItemsCart,
    };

    createOrderMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Cashier Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Cashier & POS Management</span>
            <Badge variant="outline" className="text-xs font-mono">
              Branch #{branchId}
            </Badge>
          </h1>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span>{connected ? "Push Sync Connected" : "Connecting..."}</span>
            <span>•</span>
            <span>Table queue constraint active</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setIsQueueingNext(false);
              setNewOrderTableId(null);
              setOrderFulfillment("dine_in");
              setShowNewOrderModal(true);
            }}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-xs text-white"
          >
            <Plus className="h-4 w-4" />
            + New Order / Walk-in / Delivery
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
          <div className="flex flex-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900 gap-1">
            {[
              { id: "active", label: "Active Orders" },
              { id: "queued", label: "Queued" },
              { id: "delivery", label: "🛵 Home Delivery" },
              { id: "completed", label: "Completed" },
              { id: "cancelled", label: "Cancelled" },
              { id: "all", label: "All Orders" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 rounded py-1.5 px-2 text-xs font-semibold uppercase tracking-wider transition text-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                {tab.label}
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
                const isDelivery = order.fulfillment_type === "delivery";
                const isCancelled = order.status === "cancelled";

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/20 shadow-xs dark:border-orange-500 dark:bg-neutral-900"
                        : isCancelled
                        ? "border-red-200 bg-red-50/20 dark:border-red-950 dark:bg-red-950/10"
                        : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {isDelivery ? (
                          <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5" /> Home Delivery
                          </span>
                        ) : order.table ? (
                          <span className="font-bold text-neutral-900 dark:text-neutral-100">
                            Table {order.table.code}
                          </span>
                        ) : (
                          <span className="font-bold text-neutral-900 dark:text-neutral-100">
                            Takeaway / Counter
                          </span>
                        )}

                        <Badge
                          variant={
                            order.status === "ready"
                              ? "default"
                              : order.status === "cancelled"
                              ? "danger"
                              : order.status === "out_for_delivery"
                              ? "warning"
                              : "outline"
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {order.status.replace(/_/g, " ")}
                        </Badge>

                        {order.is_queued && (
                          <Badge
                            variant="secondary"
                            className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300"
                          >
                            Queued #{order.queue_number}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500 flex-wrap">
                        <span className="font-mono">#{order.order_number}</span>
                        <span>•</span>
                        <span>{order.items.length} items</span>
                        {isDelivery && order.customer_name && (
                          <>
                            <span>•</span>
                            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                              👤 {order.customer_name}
                            </span>
                          </>
                        )}
                        {isDelivery && order.delivery_address && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px] text-neutral-500">
                              📍 {order.delivery_address}
                            </span>
                          </>
                        )}
                        {order.discount_amount > 0 && (
                          <span className="font-medium text-amber-600">
                            (-{formatMoney(order.discount_amount)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        {formatMoney(order.total_amount)}
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
                  Customers scanning QR codes are restricted to 1 active order per table. Cashier can queue next orders.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsQueueingNext(true);
                  setOrderFulfillment("dine_in");
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
              <p className="mt-2 text-sm font-medium">Select an order to view bill, cancel, or settle</p>
            </Card>
          ) : (
            <Card className="divide-y divide-neutral-200 dark:divide-neutral-800 shadow-md">
              {/* Order Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span>Order #{selectedOrder.order_number}</span>
                      {selectedOrder.fulfillment_type === "delivery" && (
                        <Badge className="bg-blue-600 text-white gap-1 text-[10px]">
                          <Truck className="h-3 w-3" /> Home Delivery
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {selectedOrder.fulfillment_type === "delivery"
                        ? `Delivery to: ${selectedOrder.customer_name || "Customer"}`
                        : selectedOrder.table
                        ? `Dining Table: ${selectedOrder.table.code}`
                        : "Takeaway Counter Order"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      selectedOrder.status === "cancelled"
                        ? "danger"
                        : selectedOrder.status === "completed"
                        ? "default"
                        : "outline"
                    }
                    className="uppercase text-xs"
                  >
                    {selectedOrder.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                {/* Cancellation Notice Banner */}
                {selectedOrder.status === "cancelled" && (
                  <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    <span className="font-bold flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Order Cancelled
                    </span>
                    <p className="mt-0.5 text-[11px]">
                      Reason: {selectedOrder.cancellation_reason || "Staff cancellation"}. Stock has been returned to inventory.
                    </p>
                  </div>
                )}

                {/* Delivery Information Box */}
                {selectedOrder.fulfillment_type === "delivery" && (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs dark:border-blue-900 dark:bg-blue-950/30 space-y-1.5">
                    <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" /> Delivery Details
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        Fee: +{formatMoney(selectedOrder.delivery_fee || 0)}
                      </span>
                    </div>
                    {selectedOrder.customer_name && (
                      <div className="text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <User className="h-3 w-3 text-neutral-400" />
                        <span>{selectedOrder.customer_name}</span>
                      </div>
                    )}
                    {selectedOrder.customer_phone && (
                      <div className="text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-neutral-400" />
                        <a href={`tel:${selectedOrder.customer_phone}`} className="text-blue-600 hover:underline">
                          {selectedOrder.customer_phone}
                        </a>
                      </div>
                    )}
                    {selectedOrder.delivery_address && (
                      <div className="text-neutral-700 dark:text-neutral-300 flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 text-neutral-400 mt-0.5 shrink-0" />
                        <span>{selectedOrder.delivery_address}</span>
                      </div>
                    )}

                    {/* Delivery Status Flow Buttons */}
                    {selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                      <div className="pt-2 flex gap-2">
                        {selectedOrder.status !== "out_for_delivery" && selectedOrder.status !== "delivered" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateDeliveryStatusMutation.mutate("out_for_delivery")}
                            disabled={updateDeliveryStatusMutation.isPending}
                            className="text-xs h-7 gap-1 border-blue-400 text-blue-700 dark:text-blue-300"
                          >
                            <Truck className="h-3 w-3" />
                            Dispatch / Out for Delivery
                          </Button>
                        )}
                        {selectedOrder.status === "out_for_delivery" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateDeliveryStatusMutation.mutate("delivered")}
                            disabled={updateDeliveryStatusMutation.isPending}
                            className="text-xs h-7 gap-1 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                      {formatMoney(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Application Section (If active) */}
              {selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                <div className="p-4 space-y-3 bg-neutral-50 dark:bg-neutral-900/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <span className="flex items-center gap-1">
                      <Percent className="h-3.5 w-3.5 text-amber-600" /> Apply Discount
                    </span>
                    {selectedOrder.discount_amount > 0 && (
                      <span className="text-amber-600">
                        Current: -{formatMoney(selectedOrder.discount_amount)} ({selectedOrder.discount_reason})
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
                      <option value="fixed">{currencySymbol.trim()} Fixed</option>
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
              )}

              {/* Totals Breakdown */}
              <div className="p-4 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatMoney(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Discount ({selectedOrder.discount_reason || "Promo"}):</span>
                    <span>-{formatMoney(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                {Number(selectedOrder.delivery_fee || 0) > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>Delivery Fee:</span>
                    <span>+{formatMoney(selectedOrder.delivery_fee || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Tax (5%):</span>
                  <span>{formatMoney(selectedOrder.tax_amount)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-neutral-900 dark:text-neutral-100">
                  <span>Total Amount:</span>
                  <span>{formatMoney(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Action Buttons: Settle Bill & Cancel Order */}
              {selectedOrder.status !== "cancelled" && (
                <div className="p-4 space-y-3">
                  {selectedOrder.status !== "completed" && (
                    <>
                      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Select Payment Method & Settle:
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => settleBillMutation.mutate("cash")}
                          disabled={settleBillMutation.isPending}
                          className="flex flex-col h-14 items-center justify-center gap-1 text-xs"
                        >
                          <Banknote className="h-4 w-4 text-emerald-600" />
                          <span>Cash</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => settleBillMutation.mutate("card")}
                          disabled={settleBillMutation.isPending}
                          className="flex flex-col h-14 items-center justify-center gap-1 text-xs"
                        >
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span>Card</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => settleBillMutation.mutate("online")}
                          disabled={settleBillMutation.isPending}
                          className="flex flex-col h-14 items-center justify-center gap-1 text-xs"
                        >
                          <Smartphone className="h-4 w-4 text-purple-600" />
                          <span>Online/UPI</span>
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Order Cancellation Button */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCancelModal(true)}
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40 text-xs flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Cancel This Order (Restore Stock & Table)</span>
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Order Cancellation Dialog */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold">Cancel Order #{selectedOrder.order_number}?</h3>
            </div>

            <p className="text-xs text-neutral-500">
              Cancelling will release any assigned dining table and automatically restore item quantities back to stock inventory.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                Select Cancellation Reason:
              </label>
              <select
                value={cancelReasonPreset}
                onChange={(e) => setCancelReasonPreset(e.target.value)}
                className="w-full rounded border border-neutral-300 bg-white p-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
              >
                <option value="Customer changed mind">Customer changed mind / Walked out</option>
                <option value="Duplicate order submitted">Duplicate order submitted</option>
                <option value="Out of stock / kitchen cannot fulfill">Out of stock / kitchen cannot fulfill</option>
                <option value="Wrong table or branch selected">Wrong table or branch selected</option>
                <option value="Payment failed / customer declined">Payment failed / customer declined</option>
                <option value="Other">Other (Type custom reason below)</option>
              </select>

              {cancelReasonPreset === "Other" && (
                <Input
                  type="text"
                  placeholder="Enter reason..."
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  className="text-xs"
                  autoFocus
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelOrderMutation.isPending}
              >
                Keep Order
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const finalReason =
                    cancelReasonPreset === "Other"
                      ? customCancelReason || "Custom cancellation"
                      : cancelReasonPreset;
                  cancelOrderMutation.mutate(finalReason);
                }}
                disabled={cancelOrderMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelOrderMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New / Queue Order Modal with Home Delivery */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {isQueueingNext ? "Queue Next Order for Table" : "Create Order (POS / Delivery / Takeaway)"}
              </h3>
              <p className="text-xs text-neutral-500">
                Choose fulfillment mode, assign table or delivery address, and add menu items.
              </p>
            </div>

            {/* 3-Way Fulfillment Selector */}
            {!isQueueingNext && (
              <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs">
                <button
                  type="button"
                  onClick={() => setOrderFulfillment("dine_in")}
                  className={`py-2 rounded font-semibold flex items-center justify-center gap-1.5 transition ${
                    orderFulfillment === "dine_in"
                      ? "bg-white text-orange-600 shadow-sm dark:bg-neutral-800 dark:text-orange-400"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                  }`}
                >
                  <Utensils className="h-3.5 w-3.5" />
                  <span>🍽️ Dine-In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFulfillment("takeaway")}
                  className={`py-2 rounded font-semibold flex items-center justify-center gap-1.5 transition ${
                    orderFulfillment === "takeaway"
                      ? "bg-white text-orange-600 shadow-sm dark:bg-neutral-800 dark:text-orange-400"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                  }`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>🥡 Takeaway</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFulfillment("delivery")}
                  className={`py-2 rounded font-semibold flex items-center justify-center gap-1.5 transition ${
                    orderFulfillment === "delivery"
                      ? "bg-white text-blue-600 shadow-sm dark:bg-neutral-800 dark:text-blue-400"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                  }`}
                >
                  <Truck className="h-3.5 w-3.5" />
                  <span>🛵 Home Delivery</span>
                </button>
              </div>
            )}

            {/* Dine-In Table Picker */}
            {orderFulfillment === "dine_in" && (
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Select Dining Table:
                </label>
                <select
                  value={newOrderTableId ?? ""}
                  onChange={(e) => setNewOrderTableId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded border border-neutral-300 bg-white p-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="">Select Table...</option>
                  {tables.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      Table {t.code} ({t.status}) — Capacity: {t.seating_capacity}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Home Delivery Specific Fields */}
            {orderFulfillment === "delivery" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3.5 dark:border-blue-900 dark:bg-blue-950/20 space-y-3">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                  <Truck className="h-4 w-4" /> Delivery Destination & Customer Info
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Customer Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Phone Number *
                    </label>
                    <Input
                      type="tel"
                      placeholder="e.g. +1-555-0145"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                    Full Delivery Street Address *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 742 Evergreen Terrace, Apt 4B, Springfield"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Delivery Fee ({currencySymbol.trim()})
                    </label>
                    <Input
                      type="number"
                      step="0.50"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                      Delivery Notes / Instructions
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Ring doorbell, gate code #1234"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items Cart Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Select Items to Order:
                </label>
                <span className="text-xs text-neutral-500">
                  {orderItemsCart.reduce((sum, c) => sum + c.quantity, 0)} items in cart
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 rounded border border-neutral-200 p-2 text-xs dark:border-neutral-800">
                {menuItems.map((item: any) => {
                  const cartItem = orderItemsCart.find((c) => c.item_id === item.id);
                  const isRegular = item.track_stock === false;
                  const currentStock = item.stock_quantity ?? 50;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {isRegular && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                              Regular (Uncounted)
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                          <span>{formatMoney(item.base_price)}</span>
                          <span>•</span>
                          {isRegular ? (
                            <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                              ♾️ Regular Item (Bill & Sales Only)
                            </span>
                          ) : (
                            <span
                              className={
                                currentStock <= 5
                                  ? "text-red-500 font-bold"
                                  : currentStock <= 15
                                  ? "text-amber-500"
                                  : "text-emerald-500"
                              }
                            >
                              📦 {currentStock} in stock
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {cartItem && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0 text-xs"
                              onClick={() => {
                                setOrderItemsCart((prev) =>
                                  prev
                                    .map((c) =>
                                      c.item_id === item.id ? { ...c, quantity: c.quantity - 1 } : c,
                                    )
                                    .filter((c) => c.quantity > 0),
                                );
                              }}
                            >
                              -
                            </Button>
                            <span className="w-5 text-center font-bold text-neutral-900 dark:text-neutral-100">
                              {cartItem.quantity}
                            </span>
                          </>
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

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
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
                onClick={handleCreateOrderSubmit}
                className="bg-orange-600 hover:bg-orange-500 text-white"
              >
                {createOrderMutation.isPending
                  ? "Submitting..."
                  : isQueueingNext
                  ? "Add to Table Queue"
                  : orderFulfillment === "delivery"
                  ? "Create Home Delivery Order"
                  : "Submit Order"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
