"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coffee,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { useRestaurantCurrency } from "@/hooks/use-restaurant-currency";
import { getStoredCache } from "@/lib/cache/browser-cache";
import { api, parseApiError } from "@/lib/api/client";
import { fetchMenuItems } from "@/features/orders/api";
import { toast } from "sonner";

interface MenuItem {
  id: number;
  restaurant_id: number;
  category_id: number;
  name: string;
  base_price: string | number;
  cost_price?: string | number;
  track_stock?: boolean;
  stock_quantity?: number;
  is_active?: boolean;
  category?: {
    id: number;
    name: string;
  };
}

export function StockPageClient({ branchId }: { branchId: number }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Role Protection: Cashiers/Kitchen cannot access Stock management screen
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin" && user.role !== "manager") {
      toast.error("Access restricted: Only restaurant managers can manage inventory stock.");
      router.replace(
        user.role === "cashier" || user.role === "waiter"
          ? `/branches/${branchId}/cashier`
          : `/branches/${branchId}/kitchen`
      );
    }
  }, [authLoading, isAuthenticated, user, router, branchId]);

  // Branch info
  const { data: branchData } = useQuery({
    queryKey: ["branch", branchId],
    queryFn: async () => {
      const { data } = await api.get(`/branches/${branchId}`);
      return data;
    },
    enabled: Boolean(branchId),
  });

  const restaurantId = branchData?.restaurant_id || user?.restaurant_id;
  const { symbol: currencySymbol, format: formatMoney } = useRestaurantCurrency(restaurantId);

  // Fetch items with local cache hydration
  const {
    data: menuItems = [],
    isLoading: itemsLoading,
    isFetching: itemsFetching,
    refetch: refetchItems,
  } = useQuery<MenuItem[]>({
    queryKey: ["menu-items", restaurantId],
    queryFn: () => fetchMenuItems(restaurantId),
    initialData: () => getStoredCache<MenuItem[]>(`menu-items:${restaurantId}`) || undefined,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // State
  const [search, setSearch] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<
    "all" | "low" | "out" | "regular"
  >("all");

  const [replenishModalOpen, setReplenishModalOpen] = useState(false);
  const [selectedItemForReplenish, setSelectedItemForReplenish] = useState<MenuItem | null>(null);
  const [replenishQty, setReplenishQty] = useState("");
  const [replenishUnitCost, setReplenishUnitCost] = useState("");
  const [replenishNote, setReplenishNote] = useState("");

  // Metrics
  const metrics = useMemo(() => {
    let trackedCount = 0;
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValuation = 0;
    let regularCount = 0;

    menuItems.forEach((item) => {
      if (item.track_stock === false) {
        regularCount++;
        return;
      }
      trackedCount++;
      const qty = item.stock_quantity ?? 0;
      totalStockUnits += qty;
      const cost = Number(item.cost_price || item.base_price) || 0;
      totalValuation += qty * cost;

      if (qty === 0) {
        outOfStockCount++;
      } else if (qty < 10) {
        lowStockCount++;
      }
    });

    return {
      trackedCount,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
      totalValuation,
      regularCount,
    };
  }, [menuItems]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const isRegular = item.track_stock === false;
      const qty = item.stock_quantity ?? 0;

      if (stockStatusFilter === "low") {
        if (isRegular || qty === 0 || qty >= 10) return false;
      } else if (stockStatusFilter === "out") {
        if (isRegular || qty > 0) return false;
      } else if (stockStatusFilter === "regular") {
        if (!isRegular) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = item.category?.name?.toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });
  }, [menuItems, stockStatusFilter, search]);

  // Mutation: Record stock purchase replenishment
  const replenishMutation = useMutation({
    mutationFn: async (payload: {
      item_id: number;
      quantity: number;
      unit_cost?: number;
      reference?: string;
    }) => {
      const res = await api.post("/menu-items/stock/purchase", payload);
      return res.data;
    },
    onSuccess: (updated) => {
      toast.success(`Stock replenished for "${updated.name}"! New stock: ${updated.stock_quantity}`);
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      setReplenishModalOpen(false);
      setSelectedItemForReplenish(null);
      setReplenishQty("");
      setReplenishUnitCost("");
      setReplenishNote("");
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  const handleOpenReplenish = (item?: MenuItem) => {
    if (item) {
      setSelectedItemForReplenish(item);
      setReplenishUnitCost(item.cost_price ? String(item.cost_price) : "");
    } else {
      // Pick first tracked item if none selected
      const firstTracked = menuItems.find((i) => i.track_stock !== false);
      setSelectedItemForReplenish(firstTracked || null);
    }
    setReplenishQty("50");
    setReplenishModalOpen(true);
  };

  const handleReplenishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForReplenish) {
      toast.error("Please select an item to replenish");
      return;
    }
    const qty = parseInt(replenishQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be at least 1 unit");
      return;
    }

    replenishMutation.mutate({
      item_id: selectedItemForReplenish.id,
      quantity: qty,
      unit_cost: replenishUnitCost ? parseFloat(replenishUnitCost) : undefined,
      reference: replenishNote.trim() || undefined,
    });
  };

  if (authLoading || (user?.role !== "admin" && user?.role !== "manager")) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Package className="size-6 text-orange-500" />
              Stock & Inventory Management
            </h1>
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-medium">
              Live Stock
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time inventory levels, reorder threshold alerts, and purchase stock replenishment for{" "}
            <strong>{branchData?.name || user?.restaurant?.name || "your branch"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await refetchItems();
              toast.success("Stock inventory updated");
            }}
            disabled={itemsFetching}
            className="gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`size-3.5 ${itemsFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => handleOpenReplenish()}
            className="bg-orange-600 hover:bg-orange-500 text-white gap-2 shadow-sm text-xs h-9"
          >
            <Plus className="size-4" />
            <span>+ Purchase / Replenish Stock</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase">
            <span>Total Stock Units</span>
            <Package className="size-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">
            {metrics.totalStockUnits.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Across {metrics.trackedCount} tracked items
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-500 mt-2">{metrics.lowStockCount}</p>
          <p className="text-xs text-neutral-400 mt-1">Items below 10 units threshold</p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase">
            <span>Out of Stock</span>
            <XCircle className="size-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-500 mt-2">{metrics.outOfStockCount}</p>
          <p className="text-xs text-neutral-400 mt-1">Immediate replenishment required</p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase">
            <span>Stock Valuation</span>
            <span className="font-bold text-xs text-emerald-500 font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {currencySymbol.trim()}
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">
            {formatMoney(metrics.totalValuation)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">Estimated total inventory value</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name or category..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setStockStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              stockStatusFilter === "all"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            All Items ({menuItems.length})
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter("low")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              stockStatusFilter === "low"
                ? "bg-white dark:bg-neutral-800 text-amber-400 shadow-sm"
                : "text-neutral-500 hover:text-amber-400"
            }`}
          >
            ⚠️ Low Stock ({metrics.lowStockCount})
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter("out")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              stockStatusFilter === "out"
                ? "bg-white dark:bg-neutral-800 text-red-400 shadow-sm"
                : "text-neutral-500 hover:text-red-400"
            }`}
          >
            🚫 Out of Stock ({metrics.outOfStockCount})
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter("regular")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              stockStatusFilter === "regular"
                ? "bg-white dark:bg-neutral-800 text-emerald-400 shadow-sm"
                : "text-neutral-500 hover:text-emerald-400"
            }`}
          >
            🍵 Regular / Untracked ({metrics.regularCount})
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Menu Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">In Stock Qty</th>
                <th className="px-4 py-3 text-right">Cost Price</th>
                <th className="px-4 py-3 text-right">Valuation</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-400">
                    <Package className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-neutral-300">No matching stock items</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Check your filters or replenish new stock above.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isRegular = item.track_stock === false;
                  const qty = item.stock_quantity ?? 0;
                  const cost = Number(item.cost_price || item.base_price) || 0;
                  const valuation = qty * cost;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          Selling: {formatMoney(item.base_price)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {item.category?.name || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isRegular ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px] font-medium gap-1">
                            <Coffee className="size-3" />
                            <span>Regular (No Stock Count)</span>
                          </Badge>
                        ) : qty === 0 ? (
                          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[11px] font-medium gap-1">
                            <XCircle className="size-3" />
                            <span>Out of Stock</span>
                          </Badge>
                        ) : qty < 10 ? (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[11px] font-medium gap-1">
                            <AlertTriangle className="size-3" />
                            <span>Low Stock (&lt; 10)</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px] font-medium gap-1">
                            <CheckCircle2 className="size-3" />
                            <span>In Stock</span>
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isRegular ? (
                          <span className="text-xs text-neutral-500 font-mono">Untracked</span>
                        ) : (
                          <span
                            className={`font-mono text-base font-bold ${
                              qty === 0
                                ? "text-red-500"
                                : qty < 10
                                ? "text-amber-400"
                                : "text-neutral-900 dark:text-white"
                            }`}
                          >
                            {qty}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-neutral-400">
                        {item.cost_price ? formatMoney(item.cost_price) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-neutral-900 dark:text-white">
                        {isRegular ? "—" : formatMoney(valuation)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isRegular ? (
                          <span className="text-xs text-neutral-500 italic">No Stock Needed</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReplenish(item)}
                            className="h-8 px-2.5 text-xs text-orange-500 hover:text-orange-400 border-orange-500/30 hover:bg-orange-500/10 gap-1"
                          >
                            <Plus className="size-3" />
                            <span>Replenish</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replenish / Purchase Modal */}
      <Dialog open={replenishModalOpen} onOpenChange={setReplenishModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-5 text-orange-500" />
              <span>Purchase / Replenish Stock</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleReplenishSubmit} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                Select Menu Item *
              </label>
              <select
                value={selectedItemForReplenish?.id || ""}
                onChange={(e) => {
                  const itm = menuItems.find((i) => i.id === Number(e.target.value));
                  setSelectedItemForReplenish(itm || null);
                  if (itm?.cost_price) setReplenishUnitCost(String(itm.cost_price));
                }}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                {menuItems
                  .filter((i) => i.track_stock !== false)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Current: {item.stock_quantity ?? 0} units)
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Quantity to Add *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={replenishQty}
                  onChange={(e) => setReplenishQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Unit Cost ({currencySymbol.trim()})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={replenishUnitCost}
                  onChange={(e) => setReplenishUnitCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                Supplier / Invoice Reference Note
              </label>
              <input
                type="text"
                value={replenishNote}
                onChange={(e) => setReplenishNote(e.target.value)}
                placeholder="e.g. Vendor PO #4092 or weekly delivery"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {selectedItemForReplenish && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400">
                Current Stock: <strong>{selectedItemForReplenish.stock_quantity ?? 0}</strong> + Added:{" "}
                <strong>{parseInt(replenishQty || "0", 10)}</strong> = New Stock:{" "}
                <strong>
                  {(selectedItemForReplenish.stock_quantity ?? 0) +
                    parseInt(replenishQty || "0", 10)}
                </strong>{" "}
                units.
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReplenishModalOpen(false)}
                disabled={replenishMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={replenishMutation.isPending}
                className="bg-orange-600 hover:bg-orange-500 text-white"
              >
                {replenishMutation.isPending ? "Recording Purchase..." : "Confirm Stock Purchase"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
