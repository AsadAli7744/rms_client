"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Banknote,
  UtensilsCrossed,
  QrCode,
  ArrowRight,
  LogIn,
  Store,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useAuth, DEMO_USERS, type UserRole } from "@/lib/auth/auth-context";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsDemoRole, isLoading } = useAuth();

  const [email, setEmail] = useState("manager@restaurant.com");
  const [password, setPassword] = useState("password123");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"roles" | "credentials">("roles");

  const handleRoleSelect = async (role: UserRole) => {
    setSubmitting(true);
    try {
      const user = await loginAsDemoRole(role);
      toast.success(`Signed in as ${user.name} (${user.role.toUpperCase()})`);
      redirectForRole(user.role, user.branch_id);
    } catch {
      toast.error("Failed to sign in. Please check backend connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      redirectForRole(user.role, user.branch_id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Invalid credentials";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const redirectForRole = (role: UserRole, branchId: number | null) => {
    const bId = branchId || 1;
    switch (role) {
      case "admin":
        router.push("/tenants");
        break;
      case "manager":
        router.push(`/branches/${bId}/item-sales`);
        break;
      case "cashier":
        router.push(`/branches/${bId}/cashier`);
        break;
      case "kitchen":
        router.push(`/branches/${bId}/kitchen`);
        break;
      case "waiter":
        router.push(`/branches/${bId}/cashier`);
        break;
      default:
        router.push("/branches");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar Branding */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-4">
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
              Cloud-native multi-restaurant & branch operating platform
            </p>
          </div>
        </div>

        <Link
          href="/order?branchId=1&tableId=1"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 transition-colors"
        >
          <QrCode className="size-3.5" />
          <span>Customer QR Scan View</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-4xl w-full mx-auto my-auto">
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

        {/* Tab Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("roles")}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "roles"
                  ? "bg-neutral-800 text-white shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              1-Click Role Personas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("credentials")}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "credentials"
                  ? "bg-neutral-800 text-white shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Standard Email Login
            </button>
          </div>
        </div>

        {activeTab === "roles" ? (
          /* Role Personas Grid */
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
                  SaaS Owner
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
                  Enter Admin <ArrowRight className="size-3" />
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
                  Restaurant Owner
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
                  Open Manager <ArrowRight className="size-3" />
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
                  Cashier POS
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
                  Enter POS <ArrowRight className="size-3" />
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
                  Kitchen KDS
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
                  Enter KDS <ArrowRight className="size-3" />
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Email Login Form */
          <div className="max-w-md mx-auto rounded-xl border border-neutral-800 bg-neutral-900/70 p-6 sm:p-8 backdrop-blur">
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurant.com"
                  required
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="size-4" />
                  <span>{submitting ? "Signing In..." : "Sign In to Dashboard"}</span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                <p className="font-semibold text-neutral-300">Quick Test Credentials:</p>
                <p>• Admin: <span className="font-mono text-neutral-200">admin@rms.com</span></p>
                <p>• Manager: <span className="font-mono text-neutral-200">manager@restaurant.com</span></p>
                <p>• Cashier: <span className="font-mono text-neutral-200">cashier@restaurant.com</span></p>
                <p>• Kitchen: <span className="font-mono text-neutral-200">kitchen@restaurant.com</span></p>
              </div>
            </form>
          </div>
        )}
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
