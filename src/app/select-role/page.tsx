"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Banknote,
  UtensilsCrossed,
  QrCode,
  ArrowRight,
  LogOut,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useAuth, DEMO_USERS, type UserRole } from "@/lib/auth/auth-context";
import { toast } from "sonner";

export default function SelectRolePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loginAsDemoRole, logout } = useAuth();
  const [submittingRole, setSubmittingRole] = useState<UserRole | null>(null);

  // Protected: Only allow access after Super Admin login
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      toast.error("Please log in as Super Admin first");
      router.replace("/login");
      return;
    }

    if (user.role !== "admin") {
      toast.error("Access restricted: Super Admin credentials required");
      const branchId = user.branch_id || 1;
      switch (user.role) {
        case "manager":
          router.replace(`/branches/${branchId}/item-sales`);
          break;
        case "cashier":
        case "waiter":
          router.replace(`/branches/${branchId}/cashier`);
          break;
        case "kitchen":
          router.replace(`/branches/${branchId}/kitchen`);
          break;
        default:
          router.replace("/login");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleRoleSelect = async (role: UserRole) => {
    setSubmittingRole(role);
    try {
      if (role === "admin") {
        router.push("/tenants");
        return;
      }
      const switchedUser = await loginAsDemoRole(role);
      toast.success(`Switched persona to ${switchedUser.name} (${switchedUser.role.toUpperCase()})`);
      const branchId = switchedUser.branch_id || 1;
      switch (role) {
        case "manager":
          router.push(`/branches/${branchId}/item-sales`);
          break;
        case "cashier":
          router.push(`/branches/${branchId}/cashier`);
          break;
        case "kitchen":
          router.push(`/branches/${branchId}/kitchen`);
          break;
        case "waiter":
          router.push(`/branches/${branchId}/cashier`);
          break;
        default:
          router.push("/branches");
      }
    } catch {
      toast.error("Failed to switch persona. Please check connection.");
    } finally {
      setSubmittingRole(null);
    }
  };

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-300">
        <div className="size-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white mb-4 animate-pulse">
          RMS
        </div>
        <p className="text-sm">Verifying Super Admin Authorization...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar Branding & Super Admin Controls */}
      <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-600/30">
            RMS
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none flex items-center gap-2">
              Restaurant Management System
              <span className="text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded px-1.5 py-0.5">
                Multi-Tenant SaaS
              </span>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Super Admin Control Center & Role Persona Switcher
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs text-purple-300">
            <ShieldCheck className="size-3.5 text-purple-400" />
            <span>Super Admin: <span className="font-mono text-purple-200">{user.email}</span></span>
          </div>

          <Link
            href="/tenants"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <span>Tenant Dashboard</span>
            <ExternalLink className="size-3" />
          </Link>

          <Link
            href="/order?branchId=1&tableId=1"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 transition-colors"
          >
            <QrCode className="size-3.5" />
            <span>Customer QR</span>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
            title="Log Out"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Role Personas Section */}
      <div className="max-w-4xl w-full mx-auto my-auto py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-1 text-xs text-neutral-300 mb-3">
            <Sparkles className="size-3.5 text-orange-400" />
            <span>Select a role or sign in with email</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Choose Your Role or Sign In
          </h2>
          <p className="text-neutral-400 text-sm mt-1 max-w-md mx-auto">
            Experience role-specific flows for SaaS Admins, Restaurant Owners, Cashiers, and Kitchen Staff.
          </p>
        </div>

        {/* 4 Role Personas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. SaaS Platform Owner */}
          <div
            onClick={() => handleRoleSelect("admin")}
            className="group relative cursor-pointer rounded-xl border border-purple-500/20 bg-neutral-900/60 p-5 hover:border-purple-500/50 hover:bg-neutral-900 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="size-11 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="size-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                SAAS OWNER
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
              {DEMO_USERS.admin.title}
            </h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              {DEMO_USERS.admin.desc}
            </p>
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono text-[11px] text-neutral-500">
                {DEMO_USERS.admin.email}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-purple-400 group-hover:translate-x-0.5 transition-transform">
                {submittingRole === "admin" ? "Opening..." : "Enter Admin"} <ArrowRight className="size-3" />
              </span>
            </div>
          </div>

          {/* 2. Restaurant Owner / Manager */}
          <div
            onClick={() => handleRoleSelect("manager")}
            className="group relative cursor-pointer rounded-xl border border-blue-500/20 bg-neutral-900/60 p-5 hover:border-blue-500/50 hover:bg-neutral-900 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="size-11 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="size-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                RESTAURANT OWNER
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-white group-hover:text-blue-300 transition-colors">
              {DEMO_USERS.manager.title}
            </h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              {DEMO_USERS.manager.desc}
            </p>
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono text-[11px] text-neutral-500">
                {DEMO_USERS.manager.email}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-blue-400 group-hover:translate-x-0.5 transition-transform">
                {submittingRole === "manager" ? "Switching..." : "Open Manager"} <ArrowRight className="size-3" />
              </span>
            </div>
          </div>

          {/* 3. Cashier Staff */}
          <div
            onClick={() => handleRoleSelect("cashier")}
            className="group relative cursor-pointer rounded-xl border border-emerald-500/20 bg-neutral-900/60 p-5 hover:border-emerald-500/50 hover:bg-neutral-900 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="size-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Banknote className="size-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                CASHIER POS
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
              {DEMO_USERS.cashier.title}
            </h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              {DEMO_USERS.cashier.desc}
            </p>
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono text-[11px] text-neutral-500">
                {DEMO_USERS.cashier.email}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                {submittingRole === "cashier" ? "Switching..." : "Enter POS"} <ArrowRight className="size-3" />
              </span>
            </div>
          </div>

          {/* 4. Kitchen Staff */}
          <div
            onClick={() => handleRoleSelect("kitchen")}
            className="group relative cursor-pointer rounded-xl border border-orange-500/20 bg-neutral-900/60 p-5 hover:border-orange-500/50 hover:bg-neutral-900 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="size-11 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="size-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                KITCHEN KDS
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-white group-hover:text-orange-300 transition-colors">
              {DEMO_USERS.kitchen.title}
            </h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              {DEMO_USERS.kitchen.desc}
            </p>
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono text-[11px] text-neutral-500">
                {DEMO_USERS.kitchen.email}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-orange-400 group-hover:translate-x-0.5 transition-transform">
                {submittingRole === "kitchen" ? "Switching..." : "Enter KDS"} <ArrowRight className="size-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Tenant SaaS Features Summary Footer */}
      <div className="max-w-6xl w-full mx-auto pt-8 border-t border-neutral-800/80 text-xs text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span>Multi-Tenant DB Partitioning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span>Real-Time SSE Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span>1-Active-Order Rule</span>
          </div>
        </div>
        <p className="text-neutral-500">
          RMS Cloud SaaS © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
