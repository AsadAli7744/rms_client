"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Store,
  DollarSign,
  Globe,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { api, parseApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface RestaurantTenant {
  id: number;
  name: string;
  code: string;
  default_currency: string;
  timezone: string;
  status: string;
  support_dine_in: boolean;
  support_pickup: boolean;
  support_delivery: boolean;
  created_at: string;
}

export default function TenantsPage() {
  const { user, switchRestaurantTenant } = useAuth();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    default_currency: "USD",
    timezone: "America/New_York",
    support_dine_in: true,
    support_pickup: true,
    support_delivery: true,
  });

  const { data, isLoading, refetch } = useQuery<{ data: RestaurantTenant[]; total: number }>({
    queryKey: ["tenants-list"],
    queryFn: async () => {
      const res = await api.get("/restaurants", { params: { limit: 50 } });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post("/restaurants", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("New Restaurant Tenant successfully registered!");
      setCreateOpen(false);
      setFormData({
        name: "",
        code: "",
        default_currency: "USD",
        timezone: "America/New_York",
        support_dine_in: true,
        support_pickup: true,
        support_delivery: true,
      });
      queryClient.invalidateQueries({ queryKey: ["tenants-list"] });
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  const restaurants = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* SaaS Admin Banner */}
      <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-neutral-900 to-neutral-900 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">
                  Multi-Tenant SaaS Administration
                </h1>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  Platform Owner View
                </Badge>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Manage, isolate, and onboard restaurant tenants across the cloud infrastructure.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5 shadow-lg shadow-purple-600/25"
          >
            <Plus className="size-4" />
            <span>Onboard New Restaurant Tenant</span>
          </Button>
        </div>

        {/* Global SaaS Platform Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-purple-500/10">
          <div className="rounded-lg bg-neutral-900/80 p-3 border border-neutral-800">
            <span className="text-[11px] font-medium text-neutral-400 uppercase">
              Total Tenants
            </span>
            <p className="text-xl font-bold text-white mt-1">
              {isLoading ? "..." : restaurants.length}
            </p>
          </div>
          <div className="rounded-lg bg-neutral-900/80 p-3 border border-neutral-800">
            <span className="text-[11px] font-medium text-neutral-400 uppercase">
              Multi-Tenancy Isolation
            </span>
            <p className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> Enforced by DB Schema
            </p>
          </div>
          <div className="rounded-lg bg-neutral-900/80 p-3 border border-neutral-800">
            <span className="text-[11px] font-medium text-neutral-400 uppercase">
              Cloud Database
            </span>
            <p className="text-sm font-semibold text-neutral-200 mt-1 flex items-center gap-1">
              <Globe className="size-3.5 text-blue-400" /> Railway PostgreSQL
            </p>
          </div>
          <div className="rounded-lg bg-neutral-900/80 p-3 border border-neutral-800">
            <span className="text-[11px] font-medium text-neutral-400 uppercase">
              Current Tenant
            </span>
            <p className="text-sm font-semibold text-purple-300 mt-1 truncate">
              {user?.restaurant?.name || "Grand Cafe & Bistro"}
            </p>
          </div>
        </div>
      </div>

      {/* Tenants List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Registered Tenants</h2>
            <p className="text-xs text-neutral-400">
              Each restaurant represents an isolated tenant with separate branches, menus, staff, and orders.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-neutral-400 text-sm">
            Loading tenants...
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl">
            <Store className="size-10 mx-auto text-neutral-600 mb-2" />
            <p className="text-sm text-neutral-300 font-medium">No restaurant tenants found</p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => setCreateOpen(true)}
            >
              Add First Tenant
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurants.map((tenant) => {
              const isCurrent = user?.restaurant_id === tenant.id;
              return (
                <div
                  key={tenant.id}
                  className={`rounded-xl border p-5 transition-all ${
                    isCurrent
                      ? "border-purple-500/60 bg-purple-950/20"
                      : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-sm text-orange-400">
                        {tenant.code || "RMS"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-white">
                            {tenant.name}
                          </h3>
                          {isCurrent && (
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px]">
                              Active Context
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400">
                          Tenant #{tenant.id} • Currency: {tenant.default_currency} • Timezone: {tenant.timezone}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        tenant.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-neutral-800 text-neutral-400"
                      }
                    >
                      {tenant.status}
                    </Badge>
                  </div>

                  {/* Channel Capabilities */}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-neutral-800/80 px-2 py-0.5 text-neutral-300">
                      🍽️ Dine-In: {tenant.support_dine_in ? "Yes" : "No"}
                    </span>
                    <span className="rounded bg-neutral-800/80 px-2 py-0.5 text-neutral-300">
                      🥡 Pickup: {tenant.support_pickup ? "Yes" : "No"}
                    </span>
                    <span className="rounded bg-neutral-800/80 px-2 py-0.5 text-neutral-300">
                      🛵 Delivery: {tenant.support_delivery ? "Yes" : "No"}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant={isCurrent ? "secondary" : "outline"}
                      onClick={() => {
                        switchRestaurantTenant(tenant.id, tenant.name);
                        toast.success(`Switched tenant context to ${tenant.name}`);
                      }}
                    >
                      {isCurrent ? "✓ Active Tenant" : "Switch to Tenant"}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/branches"
                        className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700"
                      >
                        <span>View Branches</span>
                        <ExternalLink className="size-3" />
                      </Link>
                      <Link
                        href="/branches/1/item-sales"
                        className="inline-flex items-center gap-1 rounded-md bg-orange-600/20 border border-orange-500/30 px-3 py-1.5 text-xs font-medium text-orange-300 hover:bg-orange-600/30"
                      >
                        <span>Sales Report</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Tenant Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Onboard New Restaurant Tenant</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }}
            className="space-y-4 py-2"
          >
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Restaurant Tenant Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Bella Italia Trattoria"
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Tenant Code (Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. BIT"
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Default Currency
                </label>
                <select
                  value={formData.default_currency}
                  onChange={(e) =>
                    setFormData({ ...formData, default_currency: e.target.value })
                  }
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AED">AED (AED)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                placeholder="America/New_York"
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                {createMutation.isPending ? "Creating Tenant..." : "Create Tenant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
