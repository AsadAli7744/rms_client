"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Building2, Store, Edit2, AlertTriangle, Trash2 } from "lucide-react";
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
import { getBranchColumns } from "@/features/branches/columns";
import {
  createBranch,
  updateBranch,
  archiveBranch,
  type CreateBranchPayload,
  type BranchRow,
} from "@/features/branches/api";

export function BranchesPageClient() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { snapshot, setParams } = useQueryFilters();
  const page = Number(snapshot.page ?? "1") || 1;
  const limit = Number(snapshot.limit ?? "20") || 20;
  const [localQ, setLocalQ] = useState("");
  const debouncedQ = useDebounce(localQ, 300);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRow | null>(null);
  const [archivingBranch, setArchivingBranch] = useState<BranchRow | null>(null);

  const [formData, setFormData] = useState<CreateBranchPayload>({
    restaurant_id: user?.restaurant_id || 0,
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

  const [editFormData, setEditFormData] = useState({
    name: "",
    city: "",
    branch_status: "active",
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
    ? user?.restaurant_id
    : (snapshot.restaurant_id ? Number(snapshot.restaurant_id) : undefined);

  const query = useBranchesQuery({
    page,
    limit,
    restaurant_id: restaurantId,
    q: debouncedQ || undefined,
  });

  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;

  // Redirection rules:
  // 1. Cashier/waiter/kitchen are routed to operational POS / KDS.
  // 2. If the restaurant has <= 1 branch (single-branch tenant) and user is not admin,
  //    redirect directly to their item-sales dashboard because branch switching is irrelevant.
  useEffect(() => {
    if (user?.role === "cashier" || user?.role === "waiter") {
      if (user?.branch_id) router.replace(`/branches/${user.branch_id}/cashier`);
    } else if (user?.role === "kitchen") {
      if (user?.branch_id) router.replace(`/branches/${user.branch_id}/kitchen`);
    } else if (user && user.role !== "admin" && !query.isLoading && total <= 1) {
      const bId = user.branch_id || rows[0]?.id;
      if (bId) router.replace(`/branches/${bId}/item-sales`);
    }
  }, [user, router, query.isLoading, total, rows]);

  const createMutation = useMutation({
    mutationFn: createBranch,
    onSuccess: (newBranch) => {
      toast.success(`Branch "${newBranch.name}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-branches-count"] });
      setCreateOpen(false);
      setFormData({
        restaurant_id: user?.restaurant_id || 0,
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

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateBranchPayload> }) =>
      updateBranch(id, payload),
    onSuccess: (updated) => {
      toast.success(`Branch "${updated.name}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setEditingBranch(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to update branch";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveBranch(id),
    onSuccess: () => {
      toast.success("Branch archived successfully!");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-branches-count"] });
      setArchivingBranch(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to archive branch";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== "admin") {
      toast.error("Access denied: Only SaaS Platform Owner / Admin can create branches.");
      return;
    }
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== "admin" || !editingBranch) {
      toast.error("Access denied: Only SaaS Platform Owner / Admin can update branches.");
      return;
    }
    if (!editFormData.name.trim()) {
      toast.error("Branch name is required");
      return;
    }

    updateMutation.mutate({
      id: editingBranch.id,
      payload: {
        name: editFormData.name.trim(),
        city: editFormData.city.trim(),
        branch_status: editFormData.branch_status,
      },
    });
  };

  const columns = useMemo(
    () =>
      getBranchColumns({
        isAdmin: user?.role === "admin",
        onEdit: (branch) => {
          if (user?.role !== "admin") return;
          setEditingBranch(branch);
          setEditFormData({
            name: branch.name,
            city: branch.city,
            branch_status: branch.branch_status,
          });
        },
        onArchive: (branch) => {
          if (user?.role !== "admin") return;
          setArchivingBranch(branch);
        },
      }),
    [user?.role],
  );

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
          description="Manage and switch between branches to oversee floors, tables, and reports."
          actions={
            <div className="flex items-center gap-2">
              {user?.role === "admin" && (
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-orange-600 hover:bg-orange-500 text-white gap-1.5 shadow-sm"
                >
                  <Plus className="size-4" />
                  <span>Add Branch</span>
                </Button>
              )}
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
          columns={columns}
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
          emptyDescription={
            user?.role === "admin"
              ? "No branches created yet. Click 'Add Branch' above to create one."
              : "No branches found for your restaurant."
          }
        />
      </div>

      {/* Create Branch Modal (Admin Only) */}
      {user?.role === "admin" && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Store className="size-5 text-orange-500" />
                <span>Add New Restaurant Branch</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              {restaurants.length > 0 && (
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
      )}

      {/* Edit Branch Modal (Admin Only) */}
      {user?.role === "admin" && editingBranch && (
        <Dialog open={!!editingBranch} onOpenChange={() => setEditingBranch(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="size-4 text-blue-400" />
                <span>Edit Branch ({editingBranch.code})</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Branch Status
                </label>
                <select
                  value={editFormData.branch_status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, branch_status: e.target.value })
                  }
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="temporarily_closed">Temporarily Closed</option>
                </select>
              </div>

              <DialogFooter className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingBranch(null)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Archive Branch Confirmation Modal (Admin Only) */}
      {user?.role === "admin" && archivingBranch && (
        <Dialog open={!!archivingBranch} onOpenChange={() => setArchivingBranch(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="size-5" />
                <span>Archive Branch</span>
              </DialogTitle>
            </DialogHeader>

            <div className="py-2 text-sm text-neutral-600 dark:text-neutral-300">
              Are you sure you want to archive branch{" "}
              <strong className="text-neutral-900 dark:text-white">
                {archivingBranch.name} ({archivingBranch.code})
              </strong>
              ? This branch will be deactivated from active restaurant operations.
            </div>

            <DialogFooter className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setArchivingBranch(null)}
                disabled={archiveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => archiveMutation.mutate(archivingBranch.id)}
                disabled={archiveMutation.isPending}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {archiveMutation.isPending ? "Archiving..." : "Archive Branch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
}
