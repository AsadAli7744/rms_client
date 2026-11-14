"use client";

import Link from "next/link";
import {
  Menu,
  UtensilsCrossed,
  Banknote,
  BarChart3,
  QrCode,
  LogOut,
  UserCheck,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDisclosure } from "@/hooks/use-disclosure";
import { branchNav, topNav } from "@/config/nav";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function Topbar({ branchId }: { branchId?: string }) {
  const mobile = useDisclosure(false);
  const { user, isAuthenticated, logout } = useAuth();

  const { data: branchCountData } = useQuery({
    queryKey: ["topbar-branches-count", user?.restaurant_id],
    queryFn: async () => {
      const res = await api.get(`/branches?limit=2`);
      return res.data?.total ?? 0;
    },
    enabled: !!user && user.role !== "admin",
    staleTime: 60_000,
  });

  const branchCount = user?.role === "admin" ? 999 : (branchCountData ?? 1);
  const hasMultipleBranches = branchCount > 1;

  const activeBranch = branchId || (user?.branch_id ? String(user.branch_id) : "");
  const rawItems = branchId ? [...topNav, ...branchNav(branchId)] : topNav;
  const items = rawItems
    .filter((item) => {
      if (item.role === "admin" && user?.role !== "admin") return false;
      if (item.role === "manager" && user?.role !== "admin" && user?.role !== "manager") return false;
      if (item.href === "/branches" && user?.role !== "admin" && !hasMultipleBranches) return false;
      if (item.href.startsWith("/order") && !activeBranch) return false;
      if (user?.role === "cashier") return item.href.includes("/cashier") || item.href.includes("/tables");
      if (user?.role === "kitchen") return item.href.includes("/kitchen");
      if (user?.role === "waiter") return item.href.includes("/cashier") || item.href.includes("/tables");
      return true;
    })
    .map((item) =>
      item.href.startsWith("/order") && activeBranch
        ? { ...item, href: `/branches/${activeBranch}/tables` }
        : item,
    );

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex h-14 w-full items-center justify-between px-3 sm:px-6">
        {/* Left Side: Mobile Menu + Branding + Tenant */}
        <div className="flex items-center gap-3">
          <Button
            className="lg:hidden"
            variant="outline"
            size="icon"
            type="button"
            aria-label="Open menu"
            onClick={mobile.onToggle}
          >
            <Menu className="size-4" />
          </Button>

          {/* Admin Tenants Tab link - ONLY for admin */}
          {user?.role === "admin" && (
            <Link
              href="/tenants"
              className="hidden lg:inline-flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1"
            >
              <Layers className="size-3" />
              <span>SaaS Tenants</span>
            </Link>
          )}
        </div>

        {/* Center / Right Side: Direct Role Views */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Module Shortcuts */}
          {(user?.role === "admin" || user?.role === "manager") && (
            <Link
              href={`/branches/${activeBranch}/item-sales`}
              className="hidden xl:inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <BarChart3 className="size-3.5 text-blue-500" />
              <span>Sales</span>
            </Link>
          )}

          {(user?.role === "admin" || user?.role === "manager" || user?.role === "cashier") && (
            <Link
              href={`/branches/${activeBranch}/cashier`}
              className="hidden sm:inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <Banknote className="size-3.5 text-emerald-500" />
              <span>Cashier POS</span>
            </Link>
          )}

          {(user?.role === "admin" || user?.role === "manager" || user?.role === "kitchen") && (
            <Link
              href={`/branches/${activeBranch}/kitchen`}
              className="hidden sm:inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <UtensilsCrossed className="size-3.5 text-orange-500" />
              <span>Kitchen KDS</span>
            </Link>
          )}

          {activeBranch ? (
          <Link
            href={`/branches/${activeBranch}/tables`}
            className="inline-flex items-center gap-1 rounded-md border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40"
          >
            <QrCode className="size-3.5" />
            <span className="hidden sm:inline">QR Scan</span>
          </Link>
          ) : null}

          {isAuthenticated ? (
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-500 shadow-sm"
            >
              <UserCheck className="size-3.5" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobile.open ? (
        <div className="border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950 lg:hidden">
          <div className="space-y-1">
            {user?.role === "admin" && (
              <Link
                href="/tenants"
                className="block rounded-md px-3 py-2 text-sm font-semibold text-purple-400 hover:bg-purple-900/20"
                onClick={mobile.onClose}
              >
                👑 SaaS Tenants Management
              </Link>
            )}
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-900",
                )}
                onClick={mobile.onClose}
              >
                {item.title}
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  mobile.onClose();
                  logout();
                }}
                className="block w-full text-left rounded-md px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="block rounded-md px-3 py-2 text-sm font-medium text-orange-500 hover:bg-orange-500/10"
                onClick={mobile.onClose}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
