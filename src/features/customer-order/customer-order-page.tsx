"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useRestaurantCurrency } from "@/hooks/use-restaurant-currency";
import { fetchMenuItems, createOrder, fetchTableActiveOrder } from "../orders/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/feedback/spinner";
import {
  Utensils,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Plus,
  Minus,
  Sparkles,
  Lock,
} from "lucide-react";

export function CustomerOrderPageClient({
  branchId = 1,
  tableId = 1,
  restaurantId = 1,
}: {
  branchId?: number;
  tableId?: number;
  restaurantId?: number;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<{ [itemId: number]: { quantity: number; notes?: string } }>({});
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

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
  const { format: formatMoney } = useRestaurantCurrency(effectiveRestaurantId);

  // Check if table currently has an active order
  const { data: tableStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["table-active-order", tableId],
    queryFn: () => fetchTableActiveOrder(tableId),
    refetchInterval: 12_000,
  });

  // Fetch branch menu items
  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ["menu-items", effectiveRestaurantId],
    queryFn: () => fetchMenuItems(effectiveRestaurantId),
  });

  const activeOrderOnTable = tableStatus?.activeOrder;

  // Order submission mutation
  const submitOrderMutation = useMutation({
    mutationFn: async () => {
      const items = Object.entries(cart)
        .filter(([_, item]) => item.quantity > 0)
        .map(([itemId, item]) => ({
          item_id: Number(itemId),
          quantity: item.quantity,
          notes: item.notes,
        }));

      return createOrder({
        restaurant_id: restaurantId,
        branch_id: branchId,
        table_id: tableId,
        source: "web",
        actor_role: "customer", // QR customer flow
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        notes: orderNotes || null,
        items,
      });
    },
    onSuccess: (order) => {
      setPlacedOrder(order);
      setCart({});
      refetchStatus();
    },
  });

  const cartItemsCount = Object.values(cart).reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = Object.entries(cart).reduce((sum, [itemId, item]) => {
    const mi = menuItems.find((m: any) => m.id === Number(itemId));
    const price = mi ? Number(mi.base_price) : 0;
    return sum + price * item.quantity;
  }, 0);

  const categories = Array.from(
    new Set(menuItems.map((m: any) => m.category?.name || "General")),
  );

  const filteredItems = menuItems.filter((item: any) => {
    if (selectedCategory === "all") return true;
    return (item.category?.name || "General") === selectedCategory;
  });

  return (
    <div className="mx-auto min-h-screen max-w-md bg-neutral-50 pb-24 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Restaurant / Table Header */}
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 p-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow-xs">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Restaurant QR Ordering</h1>
              <p className="text-xs text-neutral-500">Dining Table #{tableId}</p>
            </div>
          </div>
          {cartItemsCount > 0 && (
            <Badge className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
              {cartItemsCount} in cart
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Active Order / Queue Constraint Notice */}
        {activeOrderOnTable && !placedOrder && (
          <Card className="border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold">Table Has Active Order</h3>
                <p className="mt-1 text-xs leading-relaxed">
                  An active order (<strong>#{activeOrderOnTable.order_number}</strong>) is currently in progress for this table.
                </p>
                <div className="mt-2 rounded bg-amber-100/80 p-2 text-[11px] font-medium text-amber-950 dark:bg-amber-900/50 dark:text-amber-200">
                  ⚠️ Per restaurant policy, only the Cashier or Manager can queue additional orders for this table. Please speak to staff to add to queue.
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Order Placed Success Confirmation */}
        {placedOrder && (
          <Card className="border-emerald-300 bg-emerald-50 p-6 text-center text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            <h2 className="mt-2 text-lg font-bold">Order Received!</h2>
            <p className="mt-1 font-mono text-sm font-bold">#{placedOrder.order_number}</p>
            <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
              Your order has been automatically dispatched to the kitchen and cashier screen.
            </p>
            <div className="mt-4 border-t border-emerald-200 pt-3 text-xs text-neutral-600 dark:border-emerald-800 dark:text-neutral-400">
              Total: <strong>{formatMoney(placedOrder.total_amount)}</strong>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPlacedOrder(null)}
              className="mt-4 text-xs"
            >
              Order More / New View
            </Button>
          </Card>
        )}

        {/* Categories Bar */}
        {!activeOrderOnTable && (
          <>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selectedCategory === "all"
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "bg-white text-neutral-600 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400"
                }`}
              >
                All Menu
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "bg-white text-neutral-600 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Items List */}
            {menuLoading ? (
              <div className="flex justify-center py-12">
                <Spinner className="h-6 w-6" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No items available in this category.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item: any) => {
                  const qty = cart[item.id]?.quantity || 0;
                  return (
                    <Card
                      key={item.id}
                      className="flex items-center justify-between p-3.5 shadow-xs"
                    >
                      <div className="pr-3">
                        <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {item.name}
                        </div>
                        {item.short_description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                            {item.short_description}
                          </p>
                        )}
                        <div className="mt-1 font-semibold text-xs text-neutral-800 dark:text-neutral-200">
                          {formatMoney(item.base_price)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {qty > 0 ? (
                          <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
                            <button
                              type="button"
                              onClick={() => {
                                setCart((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    quantity: Math.max(0, qty - 1),
                                  },
                                }));
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded bg-white text-xs font-bold text-neutral-700 shadow-xs dark:bg-neutral-800 dark:text-neutral-300"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold">{qty}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCart((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    quantity: qty + 1,
                                  },
                                }));
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded bg-neutral-900 text-xs font-bold text-white shadow-xs dark:bg-neutral-100 dark:text-neutral-900"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCart((prev) => ({
                                ...prev,
                                [item.id]: { quantity: 1 },
                              }));
                            }}
                            className="h-8 text-xs font-semibold"
                          >
                            + Add
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Bottom Cart & Checkout Bar */}
      {!activeOrderOnTable && cartItemsCount > 0 && !placedOrder && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-500">Order Subtotal</span>
                <div className="text-lg font-bold">{formatMoney(cartSubtotal)}</div>
              </div>
              <Button
                onClick={() => submitOrderMutation.mutate()}
                disabled={submitOrderMutation.isPending}
                className="flex items-center gap-2 bg-neutral-900 text-xs font-bold text-white dark:bg-neutral-100 dark:text-neutral-900"
              >
                <ShoppingBag className="h-4 w-4" />
                Place Order ({cartItemsCount})
              </Button>
            </div>
            {submitOrderMutation.isError && (
              <div className="text-xs text-red-600">
                {(submitOrderMutation.error as any)?.response?.data?.message ||
                  "Could not place order"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
