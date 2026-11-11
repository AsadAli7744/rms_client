"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Building2, Store } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/filters/filter-bar";
import { SearchInput } from "@/components/filters/search-input";
import { ServerDataTable } from "@/components/table/server-data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQueryFilters } from "@/hooks/use-query-filters";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";
import { useBranchesQuery } from "@/features/branches/hooks";
import { branchColumns } from "@/features/branches/columns";
import { createBranch, type CreateBranchPayload } from "@/features/branches/api";

export function BranchesPageClient() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.role === "cashier" || user?.role === "waiter") {
      router.replace(`/branches/${user?.branch_id || 1}/cashier`);
    } else if (user?.role === "kitchen") {
      router.replace(`/branches/${user?.branch_id || 1}/kitchen`);
    }
  }, [user, router]);
  const { snapshot, setParams } = useQueryFilters();
  const page = Number(snapshot.page ?? "1") || 1;
  const limit = Number(snapshot.limit ?? "20") || 20;
  const [localQ, setLocalQ] = useState("");
  const debouncedQ = useDebounce(localQ, 300);

  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateBranchPayload>({
    restaurant_id: user?.restaurant_id || 1,
    name: "",
    code: "",
    phone: "",
    email: "",
    address_line_1: "",
    city: "",
    state: "",
    country: "USA",
    postal_code: "",
    branch_status: "active",
    dine_in_enabled: true,
    pickup_enabled: true,
    delivery_enabled: true,
    online_ordering_enabled: true,
  });

  // Fetch available restaurant tenants if admin/SaaS owner
  const { data: restaurantsRes } = useQuery<{ data: Array<{ id: number; name: string; code: string }> }>({
    queryKey: ["tenants-lookup"],
    queryFn: async () => {
      const res = await api.get("/restaurants?limit=100");
      return res.data;
    },
    enabled: user?.role === "admin",
  });

  const restaurants = restaurantsRes?.data || [];

  // Force non-admins to strictly view only their assigned restaurant tenant
  const restaurantId = user?.role !== "admin"
    ? (user?.restaurant_id || 1)
    : (snapshot.restaurant_id ? Number(snapshot.restaurant_id) : undefined);

  const query = useBranchesQuery({
    page,
    limit,
    restaurant_id: restaurantId,
    q: debouncedQ || undefined,
  });

  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: createBranch,
    onSuccess: (newBranch) => {
      toast.success(`Branch "${newBranch.name}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setCreateOpen(false);
      setFormData({
        restaurant_id: user?.restaurant_id || 1,
        name: "",
        code: "",
        phone: "",
        email: "",
        address_line_1: "",
        city: "",
        state: "",
        country: "USA",
        postal_code: "",
        branch_status: "active",
        dine_in_enabled: true,
        pickup_enabled: true,
        delivery_enabled: true,
        online_ordering_enabled: true,
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to create branch";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Branch name is required");
      return;
    }
    if (!formData.code.trim()) {
      toast.error("Branch code is required");
      return;
    }
    if (!formData.address_line_1.trim()) {
      toast.error("Address is required");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("City is required");
      return;
    }

    createMutation.mutate(formData);
  };

  const toolbar = useMemo(
    () => (
      <FilterBar
        onReset={() => {
          setLocalQ("");
          setParams({ page: 1, q: null, restaurant_id: null });
        }}
      >
        <div className="w-full sm:max-w-md">
          <SearchInput value={localQ} onChange={setLocalQ} />
        </div>
      </FilterBar>
    ),
    [setParams],
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Branches"
          description="Pick a branch to manage floors, halls, tables, and reservations."
          actions={
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-orange-600 hover:bg-orange-500 text-white gap-1.5 shadow-sm"
              >
                <Plus className="size-4" />
                <span>Add Branch</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => query.refetch()}
                className="gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                <span>Refresh</span>
              </Button>
            </div>
          }
        />

        {toolbar}

        <ServerDataTable
          columns={branchColumns}
          rows={rows}
          isLoading={query.isLoading}
          isError={query.isError}
          errorMessage={query.error ? String((query.error as Error).message) : undefined}
          onRetry={() => query.refetch()}
          page={page}
          limit={limit}
          total={total}
          onPageChange={(p) => setParams({ page: p })}
          onLimitChange={(l) => setParams({ page: 1, limit: l })}
          emptyTitle="No branches found"
          emptyDescription="You haven't created any branches yet. Click 'Add Branch' above to create one."
        />
      </div>

      {/* Create Branch Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="size-5 text-orange-500" />
              <span>Add New Restaurant Branch</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Restaurant Selector (Only if Super Admin) */}
            {user?.role === "admin" && restaurants.length > 0 && (
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Restaurant Tenant *
                </label>
                <select
                  value={formData.restaurant_id}
                  onChange={(e) =>
                    setFormData({ ...formData, restaurant_id: Number(e.target.value) })
                  }
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {restaurants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Uptown Bistro Branch"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Branch Code (Unique) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. UT-02"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1-555-0188"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Branch Email
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="uptown@restaurant.com"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                value={formData.address_line_1}
                onChange={(e) =>
                  setFormData({ ...formData, address_line_1: e.target.value })
                }
                placeholder="245 Uptown Ave, Suite 10"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state || ""}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="NY"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="USA"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postal_code || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                  placeholder="10022"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Service Capabilities */}
            <div className="pt-2">
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-2">
                Ordering Channels Enabled
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dine_in_enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, dine_in_enabled: e.target.checked })
                    }
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>🍽️ Dine-In</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pickup_enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, pickup_enabled: e.target.checked })
                    }
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>🥡 Pickup</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.delivery_enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, delivery_enabled: e.target.checked })
                    }
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>🛵 Delivery</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.online_ordering_enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        online_ordering_enabled: e.target.checked,
                      })
                    }
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>🌐 QR Online</span>
                </label>
              </div>
            </div>

            <DialogFooter className="mt-6 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-orange-600 hover:bg-orange-500 text-white"
              >
                {createMutation.isPending ? "Creating Branch..." : "Create Branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
