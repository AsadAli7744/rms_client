"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Store,
  DollarSign,
  Banknote,
  Globe,
  Clock,
  Sparkles,
  Users,
  UserPlus,
  Info,
  Key,
  Copy,
  Check,
  MapPin,
  Mail,
  Shield,
  Eye,
  EyeOff,
  ChefHat,
  Receipt,
  Utensils,
  RefreshCw,
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

const TIMEZONE_GROUPS = [
  {
    label: "Popular / Recommended",
    options: [
      { value: "Asia/Karachi", label: "Asia/Karachi (PKT, UTC+05:00 — Pakistan)" },
      { value: "Asia/Dubai", label: "Asia/Dubai (GST, UTC+04:00 — UAE / Gulf)" },
      { value: "Asia/Riyadh", label: "Asia/Riyadh (AST, UTC+03:00 — Saudi Arabia)" },
      { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+05:30 — India)" },
      { value: "Europe/London", label: "Europe/London (GMT/BST, UTC+00/+01 — UK)" },
      { value: "America/New_York", label: "America/New_York (EST/EDT, UTC-05/-04 — US Eastern)" },
      { value: "UTC", label: "UTC (Universal Coordinated Time)" },
    ],
  },
  {
    label: "Asia & Middle East",
    options: [
      { value: "Asia/Karachi", label: "Asia/Karachi (UTC+05:00 — Pakistan)" },
      { value: "Asia/Dubai", label: "Asia/Dubai (UTC+04:00 — UAE)" },
      { value: "Asia/Riyadh", label: "Asia/Riyadh (UTC+03:00 — Saudi Arabia)" },
      { value: "Asia/Qatar", label: "Asia/Qatar (UTC+03:00 — Qatar)" },
      { value: "Asia/Bahrain", label: "Asia/Bahrain (UTC+03:00 — Bahrain)" },
      { value: "Asia/Kuwait", label: "Asia/Kuwait (UTC+03:00 — Kuwait)" },
      { value: "Asia/Muscat", label: "Asia/Muscat (UTC+04:00 — Oman)" },
      { value: "Asia/Kolkata", label: "Asia/Kolkata (UTC+05:30 — India)" },
      { value: "Asia/Dhaka", label: "Asia/Dhaka (UTC+06:00 — Bangladesh)" },
      { value: "Asia/Colombo", label: "Asia/Colombo (UTC+05:30 — Sri Lanka)" },
      { value: "Asia/Kathmandu", label: "Asia/Kathmandu (UTC+05:45 — Nepal)" },
      { value: "Asia/Bangkok", label: "Asia/Bangkok (UTC+07:00 — Thailand / Indochina)" },
      { value: "Asia/Singapore", label: "Asia/Singapore (UTC+08:00 — Singapore)" },
      { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala_Lumpur (UTC+08:00 — Malaysia)" },
      { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong (UTC+08:00 — Hong Kong)" },
      { value: "Asia/Shanghai", label: "Asia/Shanghai (UTC+08:00 — China)" },
      { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+09:00 — Japan)" },
      { value: "Asia/Seoul", label: "Asia/Seoul (UTC+09:00 — South Korea)" },
      { value: "Asia/Jakarta", label: "Asia/Jakarta (UTC+07:00 — Indonesia)" },
      { value: "Asia/Manila", label: "Asia/Manila (UTC+08:00 — Philippines)" },
      { value: "Asia/Tashkent", label: "Asia/Tashkent (UTC+05:00 — Uzbekistan)" },
      { value: "Asia/Baku", label: "Asia/Baku (UTC+04:00 — Azerbaijan)" },
    ],
  },
  {
    label: "Europe",
    options: [
      { value: "Europe/London", label: "Europe/London (UTC+00:00 / UTC+01:00 — UK)" },
      { value: "Europe/Dublin", label: "Europe/Dublin (UTC+00:00 / UTC+01:00 — Ireland)" },
      { value: "Europe/Paris", label: "Europe/Paris (UTC+01:00 / UTC+02:00 — France)" },
      { value: "Europe/Berlin", label: "Europe/Berlin (UTC+01:00 / UTC+02:00 — Germany)" },
      { value: "Europe/Rome", label: "Europe/Rome (UTC+01:00 / UTC+02:00 — Italy)" },
      { value: "Europe/Madrid", label: "Europe/Madrid (UTC+01:00 / UTC+02:00 — Spain)" },
      { value: "Europe/Amsterdam", label: "Europe/Amsterdam (UTC+01:00 — Netherlands)" },
      { value: "Europe/Brussels", label: "Europe/Brussels (UTC+01:00 — Belgium)" },
      { value: "Europe/Zurich", label: "Europe/Zurich (UTC+01:00 — Switzerland)" },
      { value: "Europe/Vienna", label: "Europe/Vienna (UTC+01:00 — Austria)" },
      { value: "Europe/Stockholm", label: "Europe/Stockholm (UTC+01:00 — Sweden)" },
      { value: "Europe/Istanbul", label: "Europe/Istanbul (UTC+03:00 — Turkey)" },
      { value: "Europe/Athens", label: "Europe/Athens (UTC+02:00 — Greece)" },
    ],
  },
  {
    label: "Americas",
    options: [
      { value: "America/New_York", label: "America/New_York (UTC-05:00 — US Eastern)" },
      { value: "America/Chicago", label: "America/Chicago (UTC-06:00 — US Central)" },
      { value: "America/Denver", label: "America/Denver (UTC-07:00 — US Mountain)" },
      { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-08:00 — US Pacific)" },
      { value: "America/Phoenix", label: "America/Phoenix (UTC-07:00 — Arizona)" },
      { value: "America/Anchorage", label: "America/Anchorage (UTC-09:00 — Alaska)" },
      { value: "Pacific/Honolulu", label: "Pacific/Honolulu (UTC-10:00 — Hawaii)" },
      { value: "America/Toronto", label: "America/Toronto (UTC-05:00 — Canada Eastern)" },
      { value: "America/Vancouver", label: "America/Vancouver (UTC-08:00 — Canada Pacific)" },
      { value: "America/Mexico_City", label: "America/Mexico_City (UTC-06:00 — Mexico)" },
      { value: "America/Sao_Paulo", label: "America/Sao_Paulo (UTC-03:00 — Brazil)" },
      { value: "America/Buenos_Aires", label: "America/Buenos_Aires (UTC-03:00 — Argentina)" },
      { value: "America/Bogota", label: "America/Bogota (UTC-05:00 — Colombia)" },
    ],
  },
  {
    label: "Australia & Pacific",
    options: [
      { value: "Australia/Sydney", label: "Australia/Sydney (UTC+10:00 / UTC+11:00)" },
      { value: "Australia/Melbourne", label: "Australia/Melbourne (UTC+10:00 / UTC+11:00)" },
      { value: "Australia/Brisbane", label: "Australia/Brisbane (UTC+10:00)" },
      { value: "Australia/Adelaide", label: "Australia/Adelaide (UTC+09:30)" },
      { value: "Australia/Perth", label: "Australia/Perth (UTC+08:00)" },
      { value: "Pacific/Auckland", label: "Pacific/Auckland (UTC+12:00 / UTC+13:00 — New Zealand)" },
    ],
  },
  {
    label: "Africa",
    options: [
      { value: "Africa/Cairo", label: "Africa/Cairo (UTC+02:00 — Egypt)" },
      { value: "Africa/Johannesburg", label: "Africa/Johannesburg (UTC+02:00 — South Africa)" },
      { value: "Africa/Lagos", label: "Africa/Lagos (UTC+01:00 — Nigeria)" },
      { value: "Africa/Nairobi", label: "Africa/Nairobi (UTC+03:00 — Kenya)" },
      { value: "Africa/Casablanca", label: "Africa/Casablanca (UTC+01:00 — Morocco)" },
    ],
  },
  {
    label: "Universal",
    options: [
      { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    ],
  },
];

interface TenantBranch {
  id: number;
  restaurant_id: number;
  name: string;
  code: string;
  city?: string;
  phone?: string;
  branch_status?: string;
  address_line_1?: string;
}

interface TenantUser {
  id: number;
  restaurant_id: number;
  branch_id?: number | null;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  branch?: {
    id: number;
    name: string;
    code: string;
  } | null;
}

function getRoleBadge(role: string) {
  switch (role) {
    case "manager":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs font-medium text-blue-300">
          <Shield className="size-3 text-blue-400" />
          Manager
        </span>
      );
    case "cashier":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
          <Receipt className="size-3 text-emerald-400" />
          Cashier POS
        </span>
      );
    case "kitchen":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-300">
          <ChefHat className="size-3 text-amber-400" />
          Kitchen KDS
        </span>
      );
    case "waiter":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 text-xs font-medium text-purple-300">
          <Utensils className="size-3 text-purple-400" />
          Floor Waiter
        </span>
      );
    case "admin":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/30 px-2.5 py-0.5 text-xs font-medium text-violet-300">
          <ShieldCheck className="size-3 text-violet-400" />
          Tenant Admin
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-300">
          {role}
        </span>
      );
  }
}

export default function TenantsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, switchRestaurantTenant } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== "admin") {
      toast.error("Access Restricted: SaaS Platform Owner role required to access Tenants Administration.");
      const branchId = user?.branch_id || 1;
      router.replace(
        user?.role === "cashier"
          ? `/branches/${branchId}/cashier`
          : user?.role === "kitchen"
          ? `/branches/${branchId}/kitchen`
          : `/branches/${branchId}/item-sales`
      );
    }
  }, [authLoading, isAuthenticated, user, router]);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTenantForUsers, setSelectedTenantForUsers] = useState<RestaurantTenant | null>(null);
  const [selectedTenantForInfo, setSelectedTenantForInfo] = useState<RestaurantTenant | null>(null);
  const [showUserCreationPanel, setShowUserCreationPanel] = useState(false);
  const [userCreationTab, setUserCreationTab] = useState<"default" | "custom">("default");
  const [batchCreating, setBatchCreating] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    created: { name: string; email: string; role: string; password: string }[];
    skipped: string[];
  } | null>(null);

  const [defaultUsersConfig, setDefaultUsersConfig] = useState({
    domain: "",
    password: "password123",
    branch_id: "" as string | number,
  });

  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
    branch_id: "" as string | number,
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generatePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pwd = "";
    for (let i = 0; i < 7; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = selectedTenantForUsers?.code?.toUpperCase() || "RMS";
    const gen = `${prefix}@${pwd}!`;
    setUserFormData((prev) => ({ ...prev, password: gen }));
    setShowPassword(true);
  };

  const handleCreateDefaultUsers = async () => {
    if (!selectedTenantForUsers) return;
    setBatchCreating(true);
    setBatchResult(null);

    const cleanCode = selectedTenantForUsers.code
      ? selectedTenantForUsers.code.toLowerCase().replace(/[^a-z0-9]/g, "")
      : "rms";
    const domain = defaultUsersConfig.domain.trim() || `${cleanCode}.com`;
    const pwd = defaultUsersConfig.password.trim() || "password123";
    const branchId = defaultUsersConfig.branch_id ? Number(defaultUsersConfig.branch_id) : null;
    const tenantName = selectedTenantForUsers.name;

    const usersToCreate = [
      {
        name: `${tenantName} Branch Owner`,
        email: `manager@${domain}`.toLowerCase(),
        role: "manager",
        password: pwd,
        branch_id: branchId,
        restaurant_id: selectedTenantForUsers.id,
      },
      {
        name: `${tenantName} Cashier`,
        email: `cashier@${domain}`.toLowerCase(),
        role: "cashier",
        password: pwd,
        branch_id: branchId,
        restaurant_id: selectedTenantForUsers.id,
      },
      {
        name: `${tenantName} Kitchen Chef`,
        email: `kitchen@${domain}`.toLowerCase(),
        role: "kitchen",
        password: pwd,
        branch_id: branchId,
        restaurant_id: selectedTenantForUsers.id,
      },
      {
        name: `${tenantName} Waiter 1`,
        email: `waiter1@${domain}`.toLowerCase(),
        role: "waiter",
        password: pwd,
        branch_id: branchId,
        restaurant_id: selectedTenantForUsers.id,
      },
      {
        name: `${tenantName} Waiter 2`,
        email: `waiter2@${domain}`.toLowerCase(),
        role: "waiter",
        password: pwd,
        branch_id: branchId,
        restaurant_id: selectedTenantForUsers.id,
      },
    ];

    const created: { name: string; email: string; role: string; password: string }[] = [];
    const skipped: string[] = [];

    for (const u of usersToCreate) {
      try {
        await api.post("/users", u);
        created.push({ name: u.name, email: u.email, role: u.role, password: u.password });
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "";
        if (err?.response?.status === 409 || String(msg).toLowerCase().includes("already exists")) {
          skipped.push(u.email);
        } else {
          toast.error(`Error creating ${u.email}: ${parseApiError(err)}`);
        }
      }
    }

    setBatchCreating(false);
    if (created.length > 0) {
      toast.success(`Successfully provisioned ${created.length} staff account(s)!`);
    }
    if (skipped.length > 0) {
      toast.info(`${skipped.length} account(s) already existed and were skipped.`);
    }

    setBatchResult({ created, skipped });
    queryClient.invalidateQueries({
      queryKey: ["tenant-users", selectedTenantForUsers.id],
    });
  };

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

  // Live Query: Users for selected tenant
  const {
    data: tenantUsersData,
    isLoading: usersLoading,
    refetch: refetchTenantUsers,
  } = useQuery<{
    data: TenantUser[];
    meta?: { total: number };
  }>({
    queryKey: ["tenant-users", selectedTenantForUsers?.id],
    queryFn: async () => {
      if (!selectedTenantForUsers) return { data: [], meta: { total: 0 } };
      const res = await api.get("/users", {
        params: { restaurant_id: selectedTenantForUsers.id, limit: 100 },
      });
      return res.data;
    },
    enabled: !!selectedTenantForUsers,
  });

  // Live Query: Branches for selected tenant
  const activeTenantModalId = selectedTenantForUsers?.id || selectedTenantForInfo?.id;
  const { data: tenantBranchesData, isLoading: branchesLoading } = useQuery<{
    data: TenantBranch[];
    total: number;
  }>({
    queryKey: ["tenant-branches", activeTenantModalId],
    queryFn: async () => {
      if (!activeTenantModalId) return { data: [], total: 0 };
      const res = await api.get("/branches", {
        params: { restaurant_id: activeTenantModalId, limit: 100 },
      });
      return res.data;
    },
    enabled: !!activeTenantModalId,
  });

  const tenantUsers = tenantUsersData?.data ?? [];
  const tenantBranches = tenantBranchesData?.data ?? [];

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async (payload: {
      restaurant_id: number;
      branch_id?: number | null;
      name: string;
      email: string;
      password: string;
      role: string;
    }) => {
      const res = await api.post("/users", payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Account created for ${variables.name}!`);
      setCreatedCredentials({
        name: variables.name,
        email: variables.email,
        password: variables.password,
        role: variables.role,
      });
      setUserFormData({
        name: "",
        email: "",
        password: "",
        role: "manager",
        branch_id: "",
      });
      setShowUserCreationPanel(false);
      queryClient.invalidateQueries({
        queryKey: ["tenant-users", selectedTenantForUsers?.id],
      });
    },
    onError: (err) => {
      toast.error(parseApiError(err));
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

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="size-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/10">
          <ShieldAlert className="size-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied (403 Forbidden)</h2>
        <p className="text-sm text-neutral-400 max-w-md mt-2">
          The SaaS Multi-Tenant Administration portal is strictly restricted to SaaS Super Administrators. Restaurant managers and operational staff cannot view other tenant records.
        </p>
        <Link
          href={`/branches/${user?.branch_id || 1}/item-sales`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 transition-colors shadow-lg shadow-orange-600/20"
        >
          Return to My Restaurant Dashboard
        </Link>
      </div>
    );
  }

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

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5 shadow-lg shadow-purple-600/25"
            >
              <Plus className="size-4" />
              <span>Onboard New Restaurant Tenant</span>
            </Button>
          </div>
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
                  <div className="mt-5 pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant={isCurrent ? "secondary" : "outline"}
                      onClick={() => {
                        switchRestaurantTenant(tenant.id, tenant.name);
                        toast.success(`Switched tenant context to ${tenant.name}`);
                      }}
                      className={isCurrent ? "bg-purple-600/30 text-purple-200 border-purple-500/40" : ""}
                    >
                      {isCurrent ? "✓ Active Tenant" : "Switch to Tenant"}
                    </Button>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTenantForUsers(tenant);
                          setShowUserCreationPanel(false);
                          setCreatedCredentials(null);
                          setBatchResult(null);
                          const cleanCode = tenant.code
                            ? tenant.code.toLowerCase().replace(/[^a-z0-9]/g, "")
                            : "rms";
                          setDefaultUsersConfig({
                            domain: `${cleanCode}.com`,
                            password: "password123",
                            branch_id: "",
                          });
                        }}
                        className="gap-1 border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs px-2.5"
                      >
                        <Users className="size-3.5 text-blue-400" />
                        <span>Staff & Logins</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTenantForInfo(tenant)}
                        className="gap-1 border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs px-2.5"
                      >
                        <Info className="size-3.5 text-purple-400" />
                        <span>Tenant Info</span>
                      </Button>

                      <Link
                        href="/branches"
                        className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 border border-neutral-700"
                      >
                        <span>Branches</span>
                        <ExternalLink className="size-3" />
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
                  onChange={(e) => {
                    const nextCurr = e.target.value;
                    const currencyToTz: Record<string, string> = {
                      PKR: "Asia/Karachi",
                      AED: "Asia/Dubai",
                      INR: "Asia/Kolkata",
                      GBP: "Europe/London",
                      EUR: "Europe/Paris",
                      USD: "America/New_York",
                    };
                    setFormData({
                      ...formData,
                      default_currency: nextCurr,
                      timezone: currencyToTz[nextCurr] ?? formData.timezone,
                    });
                  }}
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
              <select
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                {TIMEZONE_GROUPS.map((group) => (
                  <optgroup
                    key={group.label}
                    label={group.label}
                    className="bg-neutral-800 text-neutral-300 font-semibold"
                  >
                    {group.options.map((tz) => (
                      <option
                        key={tz.value}
                        value={tz.value}
                        className="bg-neutral-900 text-white font-normal py-1"
                      >
                        {tz.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
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

      {/* 1. Tenant Info Modal */}
      <Dialog
        open={!!selectedTenantForInfo}
        onOpenChange={(open) => !open && setSelectedTenantForInfo(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedTenantForInfo && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-base text-purple-400">
                      {selectedTenantForInfo.code || "RMS"}
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{selectedTenantForInfo.name}</span>
                        <Badge
                          className={
                            selectedTenantForInfo.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"
                              : "bg-neutral-800 text-neutral-400 text-xs"
                          }
                        >
                          {selectedTenantForInfo.status}
                        </Badge>
                      </DialogTitle>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Restaurant Tenant #{selectedTenantForInfo.id} • Slug: {selectedTenantForInfo.code}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3">
                    <span className="text-[11px] font-medium text-neutral-400 block uppercase">
                      Default Currency
                    </span>
                    <p className="text-base font-semibold text-white mt-1 flex items-center gap-1.5">
                      <Banknote className="size-4 text-emerald-400" />
                      <span>{selectedTenantForInfo.default_currency}</span>
                    </p>
                  </div>

                  <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3">
                    <span className="text-[11px] font-medium text-neutral-400 block uppercase">
                      Operating Timezone
                    </span>
                    <p className="text-xs font-semibold text-white mt-1.5 flex items-center gap-1.5 truncate">
                      <Clock className="size-4 text-blue-400 shrink-0" />
                      <span className="truncate">{selectedTenantForInfo.timezone}</span>
                    </p>
                  </div>

                  <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3">
                    <span className="text-[11px] font-medium text-neutral-400 block uppercase">
                      Onboarded
                    </span>
                    <p className="text-xs font-medium text-neutral-300 mt-1.5">
                      {selectedTenantForInfo.created_at
                        ? new Date(selectedTenantForInfo.created_at).toLocaleDateString()
                        : "Active"}
                    </p>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3.5">
                  <span className="text-xs font-semibold text-neutral-300 block mb-2">
                    Fulfillment Channel Status
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2 rounded bg-neutral-800/80 px-2.5 py-1.5">
                      <span>🍽️ Dine-In</span>
                      <span className={selectedTenantForInfo.support_dine_in ? "text-emerald-400 ml-auto font-medium" : "text-neutral-500 ml-auto"}>
                        {selectedTenantForInfo.support_dine_in ? "Enabled" : "Off"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded bg-neutral-800/80 px-2.5 py-1.5">
                      <span>🥡 Takeaway</span>
                      <span className={selectedTenantForInfo.support_pickup ? "text-emerald-400 ml-auto font-medium" : "text-neutral-500 ml-auto"}>
                        {selectedTenantForInfo.support_pickup ? "Enabled" : "Off"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded bg-neutral-800/80 px-2.5 py-1.5">
                      <span>🛵 Delivery</span>
                      <span className={selectedTenantForInfo.support_delivery ? "text-emerald-400 ml-auto font-medium" : "text-neutral-500 ml-auto"}>
                        {selectedTenantForInfo.support_delivery ? "Enabled" : "Off"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Branches List */}
                <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Store className="size-4 text-orange-400" />
                      <span>Branches ({branchesLoading ? "..." : tenantBranches.length})</span>
                    </span>
                    <Link
                      href="/branches"
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <span>Manage Branches</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>

                  {branchesLoading ? (
                    <p className="text-xs text-neutral-500 py-2">Loading branches...</p>
                  ) : tenantBranches.length === 0 ? (
                    <div className="text-center py-4 bg-neutral-950/50 rounded border border-dashed border-neutral-800">
                      <p className="text-xs text-neutral-400">No branches added yet for this tenant.</p>
                      <Link href="/branches" className="mt-2 inline-block">
                        <Button size="sm" variant="outline" className="text-xs h-7 mt-1.5">
                          + Add Branch on Branches Page
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {tenantBranches.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between text-xs p-2 rounded bg-neutral-800/60 border border-neutral-700/50"
                        >
                          <div>
                            <span className="font-semibold text-white">{b.name}</span>
                            <span className="text-neutral-400 ml-2">Code: {b.code}</span>
                            {b.city && <span className="text-neutral-500 ml-2">({b.city})</span>}
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-400 text-[10px]">
                            {b.branch_status || "active"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-3 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedTenantForInfo(null)}
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      const t = selectedTenantForInfo;
                      setSelectedTenantForInfo(null);
                      setSelectedTenantForUsers(t);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
                  >
                    <Users className="size-4" />
                    <span>Manage Staff & Logins</span>
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. Tenant Users & Logins Management Modal */}
      <Dialog
        open={!!selectedTenantForUsers}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTenantForUsers(null);
            setShowUserCreationPanel(false);
            setCreatedCredentials(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTenantForUsers && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-base text-blue-400">
                      <Users className="size-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Staff & Logins — {selectedTenantForUsers.name}</span>
                      </DialogTitle>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Create and manage staff accounts (Manager, Cashier POS, Kitchen KDS, Waiter) for this tenant.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (showUserCreationPanel && userCreationTab === "default") {
                          setShowUserCreationPanel(false);
                        } else {
                          setShowUserCreationPanel(true);
                          setUserCreationTab("default");
                        }
                        setCreatedCredentials(null);
                      }}
                      className={`${
                        showUserCreationPanel && userCreationTab === "default"
                          ? "bg-purple-700 text-white"
                          : "bg-purple-600 hover:bg-purple-500 text-white"
                      } gap-1.5 shadow-sm text-xs h-8`}
                    >
                      <Sparkles className="size-3.5" />
                      <span>Create Default Users (5)</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        if (showUserCreationPanel && userCreationTab === "custom") {
                          setShowUserCreationPanel(false);
                        } else {
                          setShowUserCreationPanel(true);
                          setUserCreationTab("custom");
                          if (!userFormData.password) generatePassword();
                        }
                        setCreatedCredentials(null);
                      }}
                      className={`${
                        showUserCreationPanel && userCreationTab === "custom"
                          ? "bg-blue-700 text-white"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      } gap-1.5 shadow-sm text-xs h-8`}
                    >
                      <UserPlus className="size-3.5" />
                      <span>Custom User</span>
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* Batch Created Result Banner */}
              {batchResult && (
                <div className="rounded-lg border border-purple-500/40 bg-purple-950/30 p-3.5 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-purple-400" />
                      Default Operational Team Provisioned!
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[11px] text-neutral-400 hover:text-white"
                      onClick={() => setBatchResult(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {batchResult.created.map((c) => (
                      <div
                        key={c.email}
                        className="flex items-center justify-between p-2 rounded bg-neutral-900/80 border border-neutral-800"
                      >
                        <div>
                          <span className="font-semibold text-white">{c.name}</span>
                          <span className="font-mono text-purple-300 ml-2">({c.email})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-neutral-400">pwd: {c.password}</span>
                          {getRoleBadge(c.role)}
                        </div>
                      </div>
                    ))}
                    {batchResult.skipped.length > 0 && (
                      <p className="text-[11px] text-neutral-400 pt-1">
                        Skipped existing: {batchResult.skipped.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-purple-500/40 text-purple-300 hover:bg-purple-950/40"
                      onClick={() => {
                        if (!selectedTenantForUsers) return;
                        const domain =
                          defaultUsersConfig.domain.trim() ||
                          `${selectedTenantForUsers.code.toLowerCase()}.com`;
                        const pwd = defaultUsersConfig.password.trim() || "password123";
                        const text = [
                          `=== RMS Staff Credentials for ${selectedTenantForUsers.name} ===`,
                          `Branch Owner (Manager): manager@${domain} | Password: ${pwd}`,
                          `Cashier (POS): cashier@${domain} | Password: ${pwd}`,
                          `Kitchen Staff (KDS): kitchen@${domain} | Password: ${pwd}`,
                          `Waiter 1: waiter1@${domain} | Password: ${pwd}`,
                          `Waiter 2: waiter2@${domain} | Password: ${pwd}`,
                          `Login URL: http://localhost:3001/login`,
                          `================================================`,
                        ].join("\n");
                        copyToClipboard(text, "batch-credentials");
                      }}
                    >
                      {copiedKey === "batch-credentials" ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          <span>Copied All Credentials!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3 text-purple-400" />
                          <span>Copy All 5 Login Credentials</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Just-Created Single Credentials Banner */}
              {createdCredentials && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3.5 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="size-4" />
                      Login Account Created Successfully!
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[11px] text-neutral-400 hover:text-white"
                      onClick={() => setCreatedCredentials(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-neutral-900/80 p-2.5 rounded border border-neutral-800">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block">Name & Role</span>
                      <p className="font-semibold text-white mt-0.5">{createdCredentials.name} ({createdCredentials.role})</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block">Login Email</span>
                      <p className="font-mono text-emerald-300 mt-0.5 truncate">{createdCredentials.email}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block">Password</span>
                      <p className="font-mono text-emerald-300 mt-0.5">{createdCredentials.password}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
                      onClick={() =>
                        copyToClipboard(
                          `RMS Staff Login Details:\nTenant: ${selectedTenantForUsers.name}\nName: ${createdCredentials.name}\nRole: ${createdCredentials.role}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin at: http://localhost:3001/login`,
                          "cred-banner"
                        )
                      }
                    >
                      {copiedKey === "cred-banner" ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3 text-emerald-400" />
                          <span>Copy Login Details</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* User Creation Panel with 2 Tabs: Default vs Custom */}
              {showUserCreationPanel && (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 space-y-4">
                  {/* Segmented Tab Switch */}
                  <div className="flex items-center border border-neutral-800 rounded-lg p-1 bg-neutral-950">
                    <button
                      type="button"
                      onClick={() => setUserCreationTab("default")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                        userCreationTab === "default"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Sparkles className="size-3.5" />
                      <span>Create Default Users (5 Roles)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserCreationTab("custom");
                        if (!userFormData.password) generatePassword();
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                        userCreationTab === "custom"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <UserPlus className="size-3.5" />
                      <span>Custom User</span>
                    </button>
                  </div>

                  {/* TAB 1: Create Default Users */}
                  {userCreationTab === "default" && (
                    <div className="space-y-3.5">
                      <div className="rounded-md bg-purple-950/20 border border-purple-500/20 p-3 text-xs text-neutral-300">
                        <span className="font-semibold text-purple-300 block mb-1">
                          Standard Operational Starter Team
                        </span>
                        <p className="text-neutral-400">
                          Automatically generates <strong>5 logins</strong> for {selectedTenantForUsers.name}:
                          <strong> 1x Branch Owner (Manager)</strong>, <strong>1x Cashier</strong>, <strong>1x Kitchen Chef</strong>, and <strong>2x Floor Waiters</strong>.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-neutral-300 block mb-1">
                            Email Domain *
                          </label>
                          <input
                            type="text"
                            value={defaultUsersConfig.domain}
                            onChange={(e) =>
                              setDefaultUsersConfig({ ...defaultUsersConfig, domain: e.target.value })
                            }
                            placeholder="e.g. dogarsajji.com"
                            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-neutral-300 block mb-1">
                            Default Password *
                          </label>
                          <input
                            type="text"
                            value={defaultUsersConfig.password}
                            onChange={(e) =>
                              setDefaultUsersConfig({ ...defaultUsersConfig, password: e.target.value })
                            }
                            placeholder="password123"
                            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-neutral-300 block mb-1">
                            Assigned Branch (Optional)
                          </label>
                          <select
                            value={defaultUsersConfig.branch_id}
                            onChange={(e) =>
                              setDefaultUsersConfig({ ...defaultUsersConfig, branch_id: e.target.value })
                            }
                            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="">All Branches / HQ</option>
                            {tenantBranches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} ({b.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Live Preview List */}
                      <div className="rounded-lg border border-neutral-800 overflow-hidden">
                        <div className="bg-neutral-950 px-3 py-1.5 text-[11px] font-medium text-neutral-400 border-b border-neutral-800">
                          Accounts Preview (Will be created)
                        </div>
                        <div className="divide-y divide-neutral-800 text-xs bg-neutral-900/40">
                          {[
                            {
                              name: `${selectedTenantForUsers.name} Branch Owner`,
                              prefix: "manager",
                              role: "manager",
                              desc: "Full Branch & Floor Management",
                            },
                            {
                              name: `${selectedTenantForUsers.name} Cashier`,
                              prefix: "cashier",
                              role: "cashier",
                              desc: "POS, Bills, Queue & Checkout",
                            },
                            {
                              name: `${selectedTenantForUsers.name} Kitchen Chef`,
                              prefix: "kitchen",
                              role: "kitchen",
                              desc: "Kitchen Display (KDS) & Auto-Print",
                            },
                            {
                              name: `${selectedTenantForUsers.name} Waiter 1`,
                              prefix: "waiter1",
                              role: "waiter",
                              desc: "Floor Table Service & Ordering",
                            },
                            {
                              name: `${selectedTenantForUsers.name} Waiter 2`,
                              prefix: "waiter2",
                              role: "waiter",
                              desc: "Floor Table Service & Ordering",
                            },
                          ].map((item) => {
                            const domain =
                              defaultUsersConfig.domain.trim() ||
                              `${selectedTenantForUsers.code.toLowerCase()}.com`;
                            return (
                              <div
                                key={item.prefix}
                                className="flex items-center justify-between px-3 py-2"
                              >
                                <div>
                                  <span className="font-semibold text-white">{item.name}</span>
                                  <span className="font-mono text-neutral-400 ml-2">
                                    {item.prefix}@{domain}
                                  </span>
                                  <span className="text-[11px] text-neutral-500 ml-2">
                                    • {item.desc}
                                  </span>
                                </div>
                                <div>{getRoleBadge(item.role)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowUserCreationPanel(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={batchCreating}
                          onClick={handleCreateDefaultUsers}
                          className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
                        >
                          {batchCreating ? (
                            <>
                              <RefreshCw className="size-3.5 animate-spin" />
                              <span>Creating 5 Users...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="size-3.5" />
                              <span>⚡ Create Standard 5 Users</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Custom User Form */}
                  {userCreationTab === "custom" && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!userFormData.email || !userFormData.password || !userFormData.name) {
                          toast.error("Please fill in name, email, and password");
                          return;
                        }
                        createUserMutation.mutate({
                          restaurant_id: selectedTenantForUsers.id,
                          branch_id: userFormData.branch_id ? Number(userFormData.branch_id) : null,
                          name: userFormData.name.trim(),
                          email: userFormData.email.trim(),
                          password: userFormData.password,
                          role: userFormData.role,
                        });
                      }}
                      className="space-y-3.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-neutral-300 block mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={userFormData.name}
                            onChange={(e) =>
                              setUserFormData({ ...userFormData, name: e.target.value })
                            }
                            placeholder="e.g. Tariq Mehmood"
                            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-neutral-300 block mb-1">
                            System Role *
                          </label>
                          <select
                            value={userFormData.role}
                            onChange={(e) =>
                              setUserFormData({ ...userFormData, role: e.target.value })
                            }
                            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="manager">Restaurant Manager / Branch Owner</option>
                            <option value="cashier">Cashier (POS & Checkout)</option>
                            <option value="kitchen">Kitchen Staff (KDS Display)</option>
                            <option value="waiter">Floor Waiter</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-neutral-300 block mb-1">
                            Login Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={userFormData.email}
                            onChange={(e) =>
                              setUserFormData({ ...userFormData, email: e.target.value })
                            }
                            placeholder="e.g. tariq@dogarsajji.com"
                            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-neutral-300 block">
                              Password *
                            </label>
                            <button
                              type="button"
                              onClick={generatePassword}
                              className="text-[11px] text-blue-400 hover:text-blue-300"
                            >
                              ⚡ Generate Random
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={userFormData.password}
                              onChange={(e) =>
                                setUserFormData({ ...userFormData, password: e.target.value })
                              }
                              placeholder="Enter secure password"
                              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-neutral-300 block mb-1">
                          Assigned Branch (Optional)
                        </label>
                        <select
                          value={userFormData.branch_id}
                          onChange={(e) =>
                            setUserFormData({ ...userFormData, branch_id: e.target.value })
                          }
                          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">All Branches / HQ Context</option>
                          {tenantBranches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </select>
                        {tenantBranches.length === 0 && (
                          <p className="text-[11px] text-neutral-500 mt-1">
                            No branches created yet for this tenant. You can assign HQ or create branches later.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowUserCreationPanel(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={createUserMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5"
                        >
                          {createUserMutation.isPending ? "Creating..." : "Save & Create Login"}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Users List Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Registered Staff Accounts ({usersLoading ? "..." : tenantUsers.length})</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] gap-1 text-neutral-400 hover:text-white"
                    onClick={() => refetchTenantUsers()}
                  >
                    <RefreshCw className="size-3" />
                    <span>Refresh</span>
                  </Button>
                </div>

                {usersLoading ? (
                  <div className="text-center py-8 text-neutral-500 text-xs">Loading staff accounts...</div>
                ) : tenantUsers.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-neutral-800 rounded-lg p-6 bg-neutral-900/30">
                    <Users className="size-8 mx-auto text-neutral-600 mb-2" />
                    <p className="text-sm font-medium text-neutral-300">No staff accounts found for this tenant</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Choose an option to create standard starter logins or add a custom staff user.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
                        onClick={() => {
                          setShowUserCreationPanel(true);
                          setUserCreationTab("default");
                        }}
                      >
                        <Sparkles className="size-3.5" />
                        <span>⚡ Create Default Users (Owner, Cashier, Kitchen, 2 Waiters)</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-white gap-1.5 border-neutral-700"
                        onClick={() => {
                          setShowUserCreationPanel(true);
                          setUserCreationTab("custom");
                          generatePassword();
                        }}
                      >
                        <UserPlus className="size-3.5" />
                        <span>+ Custom User</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-neutral-800 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800">
                        <tr>
                          <th className="px-3.5 py-2 font-medium">Staff Member</th>
                          <th className="px-3.5 py-2 font-medium">Login Email</th>
                          <th className="px-3.5 py-2 font-medium">Role</th>
                          <th className="px-3.5 py-2 font-medium">Assigned Branch</th>
                          <th className="px-3.5 py-2 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/80 bg-neutral-900/40">
                        {tenantUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-neutral-800/40 transition-colors">
                            <td className="px-3.5 py-2.5 font-medium text-white">
                              {u.name}
                              <span className="text-[10px] text-neutral-500 block">ID #{u.id}</span>
                            </td>
                            <td className="px-3.5 py-2.5 font-mono text-neutral-300">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate max-w-[180px]">{u.email}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(u.email, `email-${u.id}`)}
                                  className="text-neutral-500 hover:text-white"
                                  title="Copy Email"
                                >
                                  {copiedKey === `email-${u.id}` ? (
                                    <Check className="size-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5">
                              {getRoleBadge(u.role)}
                            </td>
                            <td className="px-3.5 py-2.5 text-neutral-300">
                              {u.branch ? (
                                <span className="flex items-center gap-1 text-neutral-200">
                                  <MapPin className="size-3 text-orange-400" />
                                  <span>{u.branch.name}</span>
                                </span>
                              ) : (
                                <span className="text-neutral-500">All Branches / HQ</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-right">
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <span className="size-1.5 rounded-full bg-emerald-400"></span>
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedTenantForUsers(null);
                    setShowUserCreationPanel(false);
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
