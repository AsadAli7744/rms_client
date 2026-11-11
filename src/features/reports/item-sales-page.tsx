"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRestaurantCurrency } from "@/hooks/use-restaurant-currency";
import { toast } from "sonner";
import {
  fetchItemSalesReport,
  fetchSalesSummaryReport,
  fetchMenuItems,
  purchaseStock,
  fetchMenuCategories,
  createMenuItem,
  updateMenuItem,
  createMenuCategory,
} from "../orders/api";
import { api } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/feedback/spinner";
import {
  Calendar,
  Filter,
  TrendingUp,
  Tag,
  DollarSign,
  Package,
  Layers,
  ChevronDown,
  X,
  Check,
  RefreshCw,
  Percent,
  Plus,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  Truck,
  CheckCircle2,
  Infinity as InfinityIcon,
  Utensils,
  Sparkles,
  Coffee,
} from "lucide-react";

export function ItemSalesPageClient({ branchId }: { branchId: number }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Preset dates helper
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);

  // States
  const [datePreset, setDatePreset] = useState<"today" | "week" | "month" | "custom">("month");
  const [startDate, setStartDate] = useState(startOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "total">("daily");

  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
  const [itemSearchText, setItemSearchText] = useState("");

  // Fetch branch to identify restaurant_id
  const { data: branchData } = useQuery({
    queryKey: ["branch", branchId],
    queryFn: async () => {
      const { data } = await api.get(`/branches/${branchId}`);
      return data;
    },
    enabled: Boolean(branchId),
  });

  // Fetch available menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ["menu-items", branchId],
    queryFn: () => fetchMenuItems(),
  });

  const restaurantId = branchData?.restaurant_id || menuItems[0]?.restaurant_id || 1;
  const { symbol: currencySymbol, format: formatMoney } = useRestaurantCurrency(restaurantId);

  // Categories
  const { data: menuCategories = [] } = useQuery({
    queryKey: ["menu-categories", restaurantId],
    queryFn: () => fetchMenuCategories(restaurantId),
  });

  // Table stock type filter ('all' | 'tracked' | 'regular')
  const [stockTypeFilter, setStockTypeFilter] = useState<"all" | "tracked" | "regular">("all");

  // Add Menu Item Modal State
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategoryId, setNewItemCategoryId] = useState<number | "new">("new");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isRegularItem, setIsRegularItem] = useState(false);
  const [newItemStock, setNewItemStock] = useState("50");
  const [newItemLowThreshold, setNewItemLowThreshold] = useState("10");
  const [newItemStation, setNewItemStation] = useState("kitchen");
  const [newItemSku, setNewItemSku] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");

  // Stock Purchase / Restock Modal State
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockPurchaseItemId, setStockPurchaseItemId] = useState<number | null>(null);
  const [purchaseQty, setPurchaseQty] = useState<string>("50");
  const [unitCost, setUnitCost] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>("");
  const [purchaseNotes, setPurchaseNotes] = useState<string>("");

  // Query item sales
  const {
    data: report,
    isLoading: reportLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "item-sales-report",
      branchId,
      selectedItemIds.join(","),
      startDate,
      endDate,
      period,
    ],
    queryFn: () =>
      fetchItemSalesReport({
        branch_id: branchId,
        item_ids: selectedItemIds.length > 0 ? selectedItemIds.join(",") : undefined,
        start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
        end_date: endDate ? `${endDate}T23:59:59Z` : undefined,
        period,
      }),
  });

  // Query overall sales summary
  const { data: summary } = useQuery({
    queryKey: ["sales-summary", branchId, startDate, endDate],
    queryFn: () =>
      fetchSalesSummaryReport({
        branch_id: branchId,
        start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
        end_date: endDate ? `${endDate}T23:59:59Z` : undefined,
      }),
  });

  // Stock purchase mutation
  const stockPurchaseMutation = useMutation({
    mutationFn: (body: {
      item_id: number;
      quantity: number;
      unit_cost?: number;
      supplier?: string;
      notes?: string;
    }) => purchaseStock(body),
    onSuccess: (updatedItem) => {
      toast.success(`Successfully added +${purchaseQty} stock for ${updatedItem.name}!`);
      setShowStockModal(false);
      setPurchaseQty("50");
      setUnitCost("");
      setSupplierName("");
      setPurchaseNotes("");
      queryClient.invalidateQueries({ queryKey: ["item-sales-report"] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to add stock";
      toast.error(msg);
    },
  });

  const handleStockPurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockPurchaseItemId) {
      toast.error("Please select an item to restock");
      return;
    }
    const qty = parseInt(purchaseQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    stockPurchaseMutation.mutate({
      item_id: stockPurchaseItemId,
      quantity: qty,
      unit_cost: unitCost ? parseFloat(unitCost) : undefined,
      supplier: supplierName || undefined,
      notes: purchaseNotes || undefined,
    });
  };

  // Add menu item mutation
  const addMenuItemMutation = useMutation({
    mutationFn: async () => {
      if (!newItemName.trim()) {
        throw new Error("Item name is required");
      }
      const price = parseFloat(newItemPrice);
      if (isNaN(price) || price < 0) {
        throw new Error("Valid base price is required");
      }

      let categoryId: number | undefined;
      if (newItemCategoryId === "new") {
        if (!newCategoryName.trim()) {
          throw new Error("Please enter a category name");
        }
        const newCat = await createMenuCategory({
          restaurant_id: restaurantId,
          name: newCategoryName.trim(),
        });
        categoryId = newCat.id;
      } else {
        categoryId = newItemCategoryId;
      }

      if (!categoryId && menuCategories.length > 0) {
        categoryId = menuCategories[0].id;
      }

      if (!categoryId) {
        const defaultCat = await createMenuCategory({
          restaurant_id: restaurantId,
          name: isRegularItem ? "Regular Items" : "Main Menu",
        });
        categoryId = defaultCat.id;
      }

      const stockQty = parseInt(newItemStock, 10);
      const lowThreshold = parseInt(newItemLowThreshold, 10);
      const finalCategoryId = Number(categoryId) || 1;

      return createMenuItem({
        restaurant_id: restaurantId,
        category_id: finalCategoryId,
        name: newItemName.trim(),
        base_price: price,
        track_stock: !isRegularItem,
        stock_quantity: isRegularItem ? 0 : isNaN(stockQty) ? 50 : stockQty,
        low_stock_threshold: isRegularItem ? 0 : isNaN(lowThreshold) ? 10 : lowThreshold,
        preparation_station_type: newItemStation,
        sku: newItemSku.trim() || undefined,
        short_description: newItemDescription.trim() || undefined,
      });
    },
    onSuccess: (createdItem) => {
      toast.success(
        createdItem.track_stock
          ? `Added "${createdItem.name}" with stock tracking (${createdItem.stock_quantity} units)!`
          : `Added "${createdItem.name}" as Regular Item (uncounted stock, impacts sale & bill)!`
      );
      setShowAddItemModal(false);
      setNewItemName("");
      setNewItemPrice("");
      setNewCategoryName("");
      setIsRegularItem(false);
      setNewItemStock("50");
      setNewItemLowThreshold("10");
      setNewItemSku("");
      setNewItemDescription("");
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      queryClient.invalidateQueries({ queryKey: ["item-sales-report"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to create menu item";
      toast.error(msg);
    },
  });

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMenuItemMutation.mutate();
  };

  // Toggle track stock mutation
  const toggleTrackStockMutation = useMutation({
    mutationFn: ({ id, track_stock }: { id: number; track_stock: boolean }) =>
      updateMenuItem(id, {
        track_stock,
        stock_quantity: track_stock ? 50 : 0,
      }),
    onSuccess: (updated) => {
      toast.success(
        updated.track_stock
          ? `"${updated.name}" is now inventory-tracked.`
          : `"${updated.name}" is now a Regular Item (uncounted stock, impacts sale & bill)!`
      );
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["item-sales-report"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to update item";
      toast.error(msg);
    },
  });

  const openRestockModal = (itemId: number) => {
    setStockPurchaseItemId(itemId);
    setShowStockModal(true);
  };

  // Handlers for date presets
  const applyPreset = (preset: "today" | "week" | "month") => {
    setDatePreset(preset);
    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "week") {
      setStartDate(startOfWeekStr);
      setEndDate(todayStr);
    } else if (preset === "month") {
      setStartDate(startOfMonthStr);
      setEndDate(todayStr);
    }
  };

  // Filtered menu items for multi-select dropdown
  const filteredMenuItems = useMemo(() => {
    if (!itemSearchText.trim()) return menuItems;
    return menuItems.filter((i: any) =>
      i.name.toLowerCase().includes(itemSearchText.toLowerCase()),
    );
  }, [menuItems, itemSearchText]);

  const toggleItemSelection = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllItems = () => {
    setSelectedItemIds([]);
    setItemDropdownOpen(false);
  };

  const selectedItemNames = useMemo(() => {
    return menuItems.filter((i: any) => selectedItemIds.includes(i.id));
  }, [menuItems, selectedItemIds]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Item-wise Sales & Stock Inventory Dashboard</span>
            <Badge variant="outline" className="text-xs">
              Branch #{branchId}
            </Badge>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Track units sold, gross revenue, live inventory remaining, and record purchase stock replenishment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/branches/${branchId}/items`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:border-orange-500 hover:text-orange-500 transition-colors shadow-xs"
          >
            <Utensils className="size-3.5 text-orange-500" />
            <span>Menu Items Catalog →</span>
          </Link>

          <Link
            href={`/branches/${branchId}/stock`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:border-emerald-500 hover:text-emerald-500 transition-colors shadow-xs"
          >
            <Package className="size-3.5 text-emerald-500" />
            <span>Stock & Inventory →</span>
          </Link>

          {(user?.role === "admin" || user?.role === "manager") && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setShowAddItemModal(true);
                }}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs shadow-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add Item</span>
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  const firstTracked = menuItems.find((m: any) => m.track_stock !== false);
                  setStockPurchaseItemId(firstTracked?.id || menuItems[0]?.id || null);
                  setShowStockModal(true);
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs shadow-sm"
              >
                <Boxes className="h-4 w-4" />
                <span>+ Replenish Stock</span>
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await refetch();
              toast.success("Sales report updated");
            }}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Stock Type & Date Presets */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Stock Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Item Type:
              </span>
              <div className="flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-800 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => setStockTypeFilter("all")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    stockTypeFilter === "all"
                      ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                  }`}
                >
                  All ({report?.items.length ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setStockTypeFilter("tracked")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    stockTypeFilter === "tracked"
                      ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                  }`}
                >
                  📦 Tracked
                </button>
                <button
                  type="button"
                  onClick={() => setStockTypeFilter("regular")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    stockTypeFilter === "regular"
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "text-neutral-500 hover:text-cyan-700 dark:hover:text-cyan-400"
                  }`}
                >
                  ♾️ Regular (Tea, Rice)
                </button>
              </div>
            </div>

            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

            {/* Date Presets */}
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Date:
            </span>
            <div className="flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-800 dark:bg-neutral-900">
              {(["today", "week", "month"] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`rounded px-3 py-1 text-xs font-medium transition ${
                    datePreset === preset
                      ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                  }`}
                >
                  {preset === "today"
                    ? "Today"
                    : preset === "week"
                    ? "This Week"
                    : "This Month"}
                </button>
              ))}
            </div>

            {/* Custom Range */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="h-8 w-36 text-xs"
              />
              <span>to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="h-8 w-36 text-xs"
              />
            </div>
          </div>

          {/* Grouping / Period */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Period:
            </span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="h-8 rounded-md border border-neutral-300 bg-white px-2.5 text-xs text-neutral-800 shadow-xs focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
            >
              <option value="daily">Daily Breakdown</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="total">Total Aggregate</option>
            </select>
          </div>
        </div>

        {/* Multi-Select Items Dropdown Filter */}
        <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <Filter className="h-3.5 w-3.5" /> Items Filter:
            </span>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemDropdownOpen(!itemDropdownOpen)}
                className="flex h-8 items-center gap-2 text-xs"
              >
                {selectedItemIds.length === 0
                  ? "All Menu Items Selected"
                  : `${selectedItemIds.length} Item(s) Selected`}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>

              {itemDropdownOpen && (
                <div className="absolute left-0 z-50 mt-1 w-72 rounded-md border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                  <Input
                    placeholder="Search menu item..."
                    value={itemSearchText}
                    onChange={(e) => setItemSearchText(e.target.value)}
                    className="mb-2 h-7 text-xs"
                    autoFocus
                  />
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5 text-xs dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={selectAllItems}
                      className="font-medium text-neutral-700 hover:underline dark:text-neutral-300"
                    >
                      Select All (Reset)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedItemIds([])}
                      className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="max-h-56 space-y-1 overflow-y-auto pt-1">
                    {filteredMenuItems.map((item: any) => {
                      const selected = selectedItemIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItemSelection(item.id)}
                          className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs transition ${
                            selected
                              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </div>
                      );
                    })}
                    {filteredMenuItems.length === 0 && (
                      <div className="p-2 text-center text-xs text-neutral-500">
                        No items found
                      </div>
                    )}
                  </div>

                  <div className="mt-2 border-t border-neutral-100 pt-1.5 dark:border-neutral-800">
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setItemDropdownOpen(false)}
                    >
                      Apply Filter
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Chips for selected items */}
            {selectedItemNames.map((item: any) => (
              <Badge
                key={item.id}
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                {item.name}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => toggleItemSelection(item.id)}
                />
              </Badge>
            ))}

            {selectedItemIds.length > 0 && (
              <button
                type="button"
                onClick={selectAllItems}
                className="text-xs text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Units Sold */}
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Total Units Sold</span>
            <Package className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {reportLoading ? (
              <Spinner className="h-6 w-6" />
            ) : (
              (report?.summary.total_units_sold ?? 0).toLocaleString()
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {selectedItemIds.length > 0
              ? `Across ${selectedItemIds.length} selected items`
              : "Across sold menu items in period"}
          </p>
        </Card>

        {/* Gross Item Revenue */}
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Gross Item Revenue</span>
            <span className="font-bold text-xs text-blue-600 font-mono px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              {currencySymbol.trim()}
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {reportLoading ? (
              <Spinner className="h-6 w-6" />
            ) : (
              formatMoney(report?.summary.total_revenue ?? 0)
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-500">From counter, QR, & delivery sales</p>
        </Card>

        {/* Stock on Hand in Active Items */}
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Tracked Stock on Hand</span>
            <Boxes className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {reportLoading ? (
              <Spinner className="h-6 w-6" />
            ) : (
              (report?.summary.total_stock_on_hand ?? 0).toLocaleString()
            )}
            <span className="text-xs font-normal text-neutral-500 ml-1">units remaining</span>
          </div>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3" /> Auto-deducted on confirmed orders
          </p>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Low Stock Items</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-500">
            {reportLoading ? (
              <Spinner className="h-6 w-6" />
            ) : (
              (report?.summary.low_stock_count ?? 0)
            )}
            <span className="text-xs font-normal text-neutral-500 ml-1">items need restock</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">Threshold: &le; 10 units</p>
        </Card>
      </div>

      {/* Detailed Item Sales & Stock Table */}
      <Card className="overflow-hidden shadow-xs">
        <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Item-wise Sales & Stock Inventory
            </h2>
            <p className="text-xs text-neutral-500">
              Shows how many units each item has sold alongside current remaining stock and restock options.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {report?.items.length ?? 0} items analyzed
          </Badge>
        </div>

        {reportLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8 text-neutral-400" />
          </div>
        ) : !report?.items.length ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-neutral-300" />
            <h3 className="mt-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No sales data for selected filters
            </h3>
            <p className="text-xs text-neutral-500">
              Try selecting a wider date range or clearing the item filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
                <tr>
                  <th className="px-5 py-3">Menu Item</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3 text-right">Units Sold</th>
                  <th className="px-5 py-3 text-right">Remaining Stock</th>
                  <th className="px-5 py-3 text-right">Avg Unit Price</th>
                  <th className="px-5 py-3 text-right">Gross Revenue</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {report.items
                  .filter((item) => {
                    if (stockTypeFilter === "tracked") return item.track_stock !== false;
                    if (stockTypeFilter === "regular") return item.track_stock === false;
                    return true;
                  })
                  .map((item) => {
                    const isRegular = item.track_stock === false;
                    const stock = item.stock_quantity ?? 0;
                    const isLowStock = !isRegular && stock <= (item.low_stock_threshold ?? 10);
                    const isOutOfStock = !isRegular && stock <= 0;

                    return (
                      <tr
                        key={item.item_id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                      >
                        <td className="px-5 py-3.5 font-medium text-neutral-900 dark:text-neutral-100">
                          <div className="flex items-center gap-2">
                            <span>{item.item_name}</span>
                            {isRegular && (
                              <Badge
                                variant="outline"
                                className="border-cyan-300 bg-cyan-50 text-[10px] font-semibold text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300"
                              >
                                Regular Item
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-neutral-500">
                          <Badge variant="outline">{item.category_name}</Badge>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-neutral-500">
                          {item.sku || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-neutral-900 dark:text-neutral-100">
                          {item.total_quantity.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isRegular ? (
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800"
                              title="Regular Item: Not counted in inventory stock, impacts sales & bill only"
                            >
                              <InfinityIcon className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                              <span>Regular / Untracked</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 font-semibold">
                              {isOutOfStock ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
                                  Out of Stock (0)
                                </span>
                              ) : isLowStock ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                                  Low Stock ({stock})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                  In Stock ({stock})
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-neutral-600 dark:text-neutral-400">
                          {formatMoney(item.avg_price_per_unit)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(item.total_revenue)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            {!isRegular ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRestockModal(item.item_id)}
                                className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Restock</span>
                              </Button>
                            ) : (
                              <span className="text-[10px] font-medium text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800">
                                Bill & Sale Only
                              </span>
                            )}

                            {/* Quick toggle between Regular & Tracked */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                toggleTrackStockMutation.mutate({
                                  id: item.item_id,
                                  track_stock: isRegular ? true : false,
                                })
                              }
                              disabled={toggleTrackStockMutation.isPending}
                              title={
                                isRegular
                                  ? "Convert to Tracked Stock item"
                                  : "Convert to Regular Item (no stock count, impacts sale & bill only)"
                              }
                              className="h-7 px-2 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                            >
                              {isRegular ? "Track Stock" : "Make Regular"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Stock Purchase Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Record Stock Purchase / Restock
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStockPurchaseSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Menu Item to Restock *
                </label>
                <select
                  value={stockPurchaseItemId ?? ""}
                  onChange={(e) => setStockPurchaseItemId(Number(e.target.value))}
                  required
                  className="w-full rounded border border-neutral-300 bg-white p-2 text-xs dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-emerald-500"
                >
                  {menuItems.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Current Stock: {item.stock_quantity ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Quantity to Add *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    placeholder="50"
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Unit Cost ({currencySymbol.trim()})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    placeholder="e.g. 2.50"
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Supplier / Vendor Name
                </label>
                <Input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Metro Wholesale Foods"
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Purchase Notes / Invoice Ref
                </label>
                <Input
                  type="text"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  placeholder="e.g. PO-8902 received at loading bay"
                  className="text-xs h-9"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStockModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={stockPurchaseMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {stockPurchaseMutation.isPending ? "Updating Stock..." : "Confirm Stock Purchase"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal (Supports Regular Items e.g. Tea, Rice with Checkbox) */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Add New Menu Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Item Name *
                </label>
                <Input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Special Tea, Basmati Rice, Naan, Mint Raita"
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Base Price ({currencySymbol.trim()}) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="e.g. 50 or 2.50"
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Preparation Station
                  </label>
                  <select
                    value={newItemStation}
                    onChange={(e) => setNewItemStation(e.target.value)}
                    className="w-full rounded border border-neutral-300 bg-white p-2 text-xs dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="bar">Bar / Beverage</option>
                    <option value="grill">Grill / Oven</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Category *
                </label>
                {menuCategories.length > 0 && newItemCategoryId !== "new" ? (
                  <div className="space-y-1.5">
                    <select
                      value={newItemCategoryId}
                      onChange={(e) => {
                        if (e.target.value === "new") {
                          setNewItemCategoryId("new");
                        } else {
                          setNewItemCategoryId(Number(e.target.value));
                        }
                      }}
                      className="w-full rounded border border-neutral-300 bg-white p-2 text-xs dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-orange-500"
                    >
                      {menuCategories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="new">+ Create New Category...</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Beverages, Sides, Roti & Naan, Rice"
                      className="text-xs h-9"
                    />
                    {menuCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewItemCategoryId(menuCategories[0]?.id || "new")}
                        className="text-[11px] text-orange-600 hover:underline"
                      >
                        Select existing category instead
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* CHECKBOX FOR REGULAR ITEMS */}
              <div className="rounded-lg border-2 border-dashed border-cyan-500/50 bg-cyan-50/70 p-3.5 dark:border-cyan-500/30 dark:bg-cyan-950/25 transition-all">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="isRegularItemCheckbox"
                    checked={isRegularItem}
                    onChange={(e) => setIsRegularItem(e.target.checked)}
                    className="mt-0.5 h-4.5 w-4.5 rounded border-neutral-300 text-cyan-600 focus:ring-cyan-500 accent-cyan-600"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Regular Item (Do not count in inventory stock)
                      </span>
                      <Badge className="text-[10px] bg-cyan-600 text-white hover:bg-cyan-600">
                        e.g. Tea, Rice, Roti
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      Regular items are <strong>never counted in stock</strong> (unlimited stock). They <strong>always impact sales revenue, order totals, cashier bills, and customer receipts</strong>.
                    </p>
                  </div>
                </label>
              </div>

              {/* If NOT regular item: show stock inventory fields */}
              {!isRegularItem ? (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Initial Stock Quantity
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={newItemStock}
                      onChange={(e) => setNewItemStock(e.target.value)}
                      placeholder="50"
                      className="text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Low Stock Alert Threshold
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={newItemLowThreshold}
                      onChange={(e) => setNewItemLowThreshold(e.target.value)}
                      placeholder="10"
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-900">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Unlimited stock enabled: Item can be billed continuously without stock limits.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    SKU / Code (Optional)
                  </label>
                  <Input
                    type="text"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    placeholder="e.g. TEA-01"
                    className="text-xs h-9 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Description (Optional)
                  </label>
                  <Input
                    type="text"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="e.g. Freshly brewed cardamom tea"
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddItemModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addMenuItemMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                >
                  {addMenuItemMutation.isPending
                    ? "Creating..."
                    : isRegularItem
                    ? "Add Regular Item"
                    : "Add Tracked Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
