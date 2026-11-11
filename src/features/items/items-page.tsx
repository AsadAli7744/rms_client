"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Utensils,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  Coffee,
  Package,
  Layers,
  DollarSign,
  AlertCircle,
  ShieldAlert,
  RefreshCw,
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
import { fetchMenuItems, fetchMenuCategories, createMenuCategory } from "@/features/orders/api";
import { toast } from "sonner";

interface MenuItem {
  id: number;
  restaurant_id: number;
  category_id: number;
  name: string;
  slug?: string;
  description?: string;
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

export function ItemsPageClient({ branchId }: { branchId: number }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Enforce role-based module access: Cashiers/Kitchen/Waiters cannot access Items screen
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin" && user.role !== "manager") {
      toast.error("Access restricted: Only restaurant managers can manage menu items.");
      router.replace(
        user.role === "cashier" || user.role === "waiter"
          ? `/branches/${branchId}/cashier`
          : `/branches/${branchId}/kitchen`
      );
    }
  }, [authLoading, isAuthenticated, user, router, branchId]);

  // Fetch branch details
  const { data: branchData } = useQuery({
    queryKey: ["branch", branchId],
    queryFn: async () => {
      const { data } = await api.get(`/branches/${branchId}`);
      return data;
    },
    enabled: Boolean(branchId),
  });

  const restaurantId = branchData?.restaurant_id || user?.restaurant_id || 1;
  const { symbol: currencySymbol, format: formatMoney } = useRestaurantCurrency(restaurantId);

  // Fetch menu items with local cache hydration
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

  // Fetch categories with local cache hydration
  const { data: categories = [] } = useQuery({
    queryKey: ["menu-categories", restaurantId],
    queryFn: () => fetchMenuCategories(restaurantId),
    initialData: () => getStoredCache<any[]>(`menu-categories:${restaurantId}`) || undefined,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "regular" | "tracked">("all");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [archivingItem, setArchivingItem] = useState<MenuItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "" as string | number,
    basePrice: "",
    costPrice: "",
    description: "",
    isRegularItem: false,
    initialStock: "0",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    categoryId: "" as string | number,
    basePrice: "",
    costPrice: "",
    description: "",
    trackStock: true,
    isActive: true,
  });

  // Category creation modal
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Filtered items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.category_id !== selectedCategory) {
        return false;
      }
      // Type filter
      if (typeFilter === "regular" && item.track_stock !== false) {
        return false;
      }
      if (typeFilter === "tracked" && item.track_stock === false) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = item.category?.name?.toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, typeFilter, search]);

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: async (payload: {
      restaurant_id: number;
      category_id: number;
      name: string;
      base_price: number;
      cost_price?: number;
      description?: string;
      track_stock?: boolean;
      stock_quantity?: number;
    }) => {
      const res = await api.post("/menu-items", payload);
      return res.data;
    },
    onSuccess: (newItem) => {
      toast.success(`Menu item "${newItem.name}" added successfully!`);
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      setAddModalOpen(false);
      setFormData({
        name: "",
        categoryId: "",
        basePrice: "",
        costPrice: "",
        description: "",
        isRegularItem: false,
        initialStock: "0",
      });
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.patch(`/menu-items/${id}`, payload);
      return res.data;
    },
    onSuccess: (updated) => {
      toast.success(`Item "${updated.name}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      setEditingBranchItem(null);
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  const archiveItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/menu-items/${id}/archive`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Item removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      setArchivingItem(null);
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => createMenuCategory({ restaurant_id: restaurantId, name }),
    onSuccess: (newCat) => {
      toast.success(`Category "${newCat.name}" created!`);
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      setShowAddCategory(false);
      setNewCatName("");
      setFormData((prev) => ({ ...prev, categoryId: newCat.id }));
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    const catId = Number(formData.categoryId) || categories[0]?.id || 1;
    const price = parseFloat(formData.basePrice);
    if (isNaN(price) || price < 0) {
      toast.error("Valid selling price is required");
      return;
    }

    createItemMutation.mutate({
      restaurant_id: restaurantId,
      category_id: catId,
      name: formData.name.trim(),
      base_price: price,
      cost_price: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
      description: formData.description.trim() || undefined,
      track_stock: !formData.isRegularItem,
      stock_quantity: formData.isRegularItem ? 0 : Number(formData.initialStock) || 0,
    });
  };

  const setEditingBranchItem = (item: MenuItem | null) => {
    setEditingItem(item);
    if (item) {
      setEditFormData({
        name: item.name,
        categoryId: item.category_id,
        basePrice: String(item.base_price),
        costPrice: item.cost_price ? String(item.cost_price) : "",
        description: item.description || "",
        trackStock: item.track_stock !== false,
        isActive: item.is_active !== false,
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editFormData.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    const price = parseFloat(editFormData.basePrice);
    if (isNaN(price) || price < 0) {
      toast.error("Valid selling price is required");
      return;
    }

    updateItemMutation.mutate({
      id: editingItem.id,
      payload: {
        name: editFormData.name.trim(),
        category_id: Number(editFormData.categoryId) || editingItem.category_id,
        base_price: price,
        cost_price: editFormData.costPrice ? parseFloat(editFormData.costPrice) : undefined,
        description: editFormData.description.trim() || undefined,
        track_stock: editFormData.trackStock,
        is_active: editFormData.isActive,
      },
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
              <Utensils className="size-6 text-orange-500" />
              Menu Items Catalog
            </h1>
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-medium">
              {filteredItems.length} Items
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Configure dishes, prices, descriptions, and regular items (tea, rice) for{" "}
            <strong>{branchData?.name || "Downtown Main Branch"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await refetchItems();
              toast.success("Menu items updated");
            }}
            disabled={itemsFetching}
            className="gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`size-3.5 ${itemsFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white gap-2 shadow-sm text-xs h-9"
          >
            <Plus className="size-4" />
            <span>+ Add Menu Item</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
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

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              typeFilter === "all"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            All Items ({menuItems.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("tracked")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              typeFilter === "tracked"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            📦 Tracked Stock
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("regular")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              typeFilter === "regular"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            🍵 Regular Items (Untracked)
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
            selectedCategory === "all"
              ? "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400"
              : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          }`}
        >
          All Categories
        </button>
        {categories.map((c: any) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              selectedCategory === c.id
                ? "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400"
                : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Items Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-right">Cost Price</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-400">
                    <Utensils className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-neutral-300">No menu items found</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Click "+ Add Menu Item" to register your first dish or regular item.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isRegular = item.track_stock === false;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-xs text-neutral-400 truncate max-w-xs mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {item.category?.name || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isRegular ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px] font-medium gap-1">
                            <Coffee className="size-3" />
                            <span>Regular (Untracked)</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[11px] font-medium gap-1">
                            <Package className="size-3" />
                            <span>Tracked Stock ({item.stock_quantity ?? 0})</span>
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-white">
                        {formatMoney(item.base_price)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-neutral-400">
                        {item.cost_price ? formatMoney(item.cost_price) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block size-2 rounded-full ${
                            item.is_active !== false ? "bg-emerald-500" : "bg-neutral-500"
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingBranchItem(item)}
                            className="h-8 px-2 text-xs text-neutral-300 hover:text-white gap-1"
                          >
                            <Edit2 className="size-3.5 text-blue-400" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setArchivingItem(item)}
                            className="h-8 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Menu Item Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="size-5 text-orange-500" />
              <span>Add New Menu Item</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Special Chicken Biryani, Karak Chai"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="text-[11px] text-orange-400 hover:underline"
                  >
                    + New
                  </button>
                </div>
                {showAddCategory ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Category name"
                      className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 text-xs text-neutral-900 dark:text-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (newCatName.trim()) createCategoryMutation.mutate(newCatName.trim());
                      }}
                      className="bg-orange-600 text-xs px-2 h-auto"
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Selling Price ({currencySymbol.trim()}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Regular Item Checkbox */}
            <div className="p-3.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRegularItem}
                  onChange={(e) => setFormData({ ...formData, isRegularItem: e.target.checked })}
                  className="size-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-emerald-400 block">
                    Regular Item (Do not count in inventory stock)
                  </span>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                    Enable for frequent items like <strong>tea, rice, bread, or sauces</strong>{" "}
                    that impact sales revenue and customer bills without tracking piece-by-piece
                    inventory stock.
                  </p>
                </div>
              </label>
            </div>

            {/* If Tracked Stock: Show Initial Stock */}
            {!formData.isRegularItem && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Cost Price ({currencySymbol.trim()})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ingredients, preparation details, or flavor profile..."
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={createItemMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createItemMutation.isPending}
                className="bg-orange-600 hover:bg-orange-500 text-white"
              >
                {createItemMutation.isPending ? "Adding Item..." : "Add to Menu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Menu Item Modal */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingBranchItem(null)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="size-5 text-blue-400" />
                <span>Edit Item: {editingItem.name}</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={editFormData.categoryId}
                    onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Selling Price ({currencySymbol.trim()}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.basePrice}
                    onChange={(e) => setEditFormData({ ...editFormData, basePrice: e.target.value })}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Regular vs Tracked toggle */}
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                      Track Inventory Stock
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Disable for regular items (tea, rice) to avoid stock decrement warnings.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editFormData.trackStock}
                    onChange={(e) => setEditFormData({ ...editFormData, trackStock: e.target.checked })}
                    className="size-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="editIsActive" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Item is active and available for ordering
                </label>
              </div>

              <DialogFooter className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingBranchItem(null)}
                  disabled={updateItemMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateItemMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {updateItemMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Archive Modal */}
      {archivingItem && (
        <Dialog open={!!archivingItem} onOpenChange={() => setArchivingItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <AlertCircle className="size-5" />
                <span>Remove Menu Item</span>
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 py-2">
              Are you sure you want to remove <strong>{archivingItem.name}</strong> from the
              active menu catalog?
            </p>
            <DialogFooter className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setArchivingItem(null)}
                disabled={archiveItemMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => archiveItemMutation.mutate(archivingItem.id)}
                disabled={archiveItemMutation.isPending}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {archiveItemMutation.isPending ? "Removing..." : "Remove Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
