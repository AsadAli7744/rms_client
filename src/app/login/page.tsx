"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogIn,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth, type UserRole } from "@/lib/auth/auth-context";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirectForRole = async (role: UserRole, branchId: number | null) => {
    let bId = branchId;
    if (!bId && role !== "admin") {
      const { data } = await api.get("/branches/default");
      bId = data?.id ?? null;
    }
    if (!bId && role !== "admin") return;
    switch (role) {
      case "admin":
        // Super Admin lands on the Role Selector & Personas Control Center
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

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      await redirectForRole(user.role, user.branch_id);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Invalid email or password";
      toast.error(msg);
    } finally {
      setSubmitting(false);
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

      </div>

      {/* Main Login Form (Standard Login Screen Only) */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="text-center mb-6">
          <div className="inline-flex size-12 rounded-2xl bg-orange-600/10 border border-orange-500/20 items-center justify-center text-orange-400 mb-3 shadow-lg shadow-orange-600/10">
            <Lock className="size-6 text-orange-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Sign In to RMS
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1.5">
            Enter your credentials to access your restaurant operations or admin portal.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8 backdrop-blur shadow-2xl">
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurant.com"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-neutral-700/80 bg-neutral-950/80 pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-neutral-700/80 bg-neutral-950/80 pl-9 pr-10 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="size-4" />
                <span>{submitting ? "Signing In..." : "Sign In to Dashboard"}</span>
              </button>
            </div>
          </form>
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
