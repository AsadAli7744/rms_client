"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  UtensilsCrossed,
  Banknote,
  BarChart3,
  QrCode,
  LogOut,
  Building2,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Layers,
  ArrowRightLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDisclosure } from "@/hooks/use-disclosure";
import { branchNav, topNav } from "@/config/nav";
import { cn } from "@/lib/utils/cn";
import { useAuth, DEMO_USERS, type UserRole } from "@/lib/auth/auth-context";
import { useSidebar } from "./sidebar-context";

const ROLE_BADGE_STYLE: Record<UserRole, { label: string; class: string }> = {
  admin: {
    label: "SaaS Owner",
    class: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  manager: {
    label: "Owner / Manager",
    class: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  cashier: {
    label: "Cashier POS",
    class: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  kitchen: {
    label: "Kitchen KDS",
    class: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  },
  waiter: {
    label: "Floor Waiter",
    class: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  },
};

export function Topbar({ branchId }: { branchId?: string }) {
  const mobile = useDisclosure(false);
  const { user, isAuthenticated, logout, loginAsDemoRole } = useAuth();
  const { collapsed, toggle: toggleSidebar } = useSidebar();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const items = branchId ? [...topNav, ...branchNav(branchId)] : topNav;
  const activeBranch = branchId || (user?.branch_id ? String(user.branch_id) : "1");

  const currentRole = user?.role || "manager";
  const roleInfo = ROLE_BADGE_STYLE[currentRole] || ROLE_BADGE_STYLE.manager;

  const handleRoleSwitch = async (role: UserRole) => {
    setRoleMenuOpen(false);
    await loginAsDemoRole(role);
    // Role-specific navigation
    if (role === "admin") {
      window.location.href = "/tenants";
    } else if (role === "manager") {
      window.location.href = `/branches/${activeBranch}/item-sales`;
    } else if (role === "cashier") {
      window.location.href = `/branches/${activeBranch}/cashier`;
    } else if (role === "kitchen") {
      window.location.href = `/branches/${activeBranch}/kitchen`;
    }
  };

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

          {/* Desktop Sidebar Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-900 transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4.5" />
            ) : (
              <PanelLeftClose className="size-4.5" />
            )}
          </button>

          <Link href="/branches" className="text-sm font-semibold flex items-center gap-2">
            <span className="rounded bg-orange-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
              RMS
            </span>
            <span className="hidden sm:inline font-bold">Multi-Tenant SaaS</span>
          </Link>

          {/* Tenant Name Pill */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-400">
            <Building2 className="size-3 text-orange-500" />
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 max-w-[140px] truncate">
              {user?.restaurant?.name || "Grand Cafe & Bistro"}
            </span>
          </div>

          {/* Admin Tenants Tab link */}
          <Link
            href="/tenants"
            className="hidden lg:inline-flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1"
          >
            <Layers className="size-3" />
            <span>SaaS Tenants</span>
          </Link>
        </div>

        {/* Center / Right Side: Direct Role Views */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Module Shortcuts */}
          <Link
            href={`/branches/${activeBranch}/item-sales`}
            className="hidden xl:inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <BarChart3 className="size-3.5 text-blue-500" />
            <span>Sales</span>
          </Link>

          <Link
            href={`/branches/${activeBranch}/cashier`}
            className="hidden sm:inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <Banknote className="size-3.5 text-emerald-500" />
            <span>Cashier POS</span>
          </Link>

          <Link
            href={`/branches/${activeBranch}/kitchen`}
            className="hidden sm:inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <UtensilsCrossed className="size-3.5 text-orange-500" />
            <span>Kitchen KDS</span>
          </Link>

          <Link
            href={`/order?branchId=${activeBranch}&tableId=1`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-md border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40"
          >
            <QrCode className="size-3.5" />
            <span className="hidden sm:inline">QR Scan</span>
          </Link>

          {/* User Profile & Role Switcher */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 text-xs hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
              >
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleInfo.class}`}>
                  {roleInfo.label}
                </span>
                <span className="hidden md:inline font-medium text-neutral-900 dark:text-neutral-100">
                  {user?.name || "User"}
                </span>
                <ChevronDown className="size-3 text-neutral-400" />
              </button>

              {/* Dropdown Menu */}
              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-700 bg-neutral-900 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 text-neutral-100">
                  {/* User Profile Header */}
                  <div className="px-3 py-2 border-b border-neutral-800 mb-2">
                    <p className="text-xs font-bold text-white">{user?.name}</p>
                    <p className="text-[11px] text-neutral-400 font-mono">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleInfo.class}`}>
                        {roleInfo.label}
                      </span>
                      {user?.restaurant?.name && (
                        <p className="text-[11px] text-purple-400 truncate">
                          {user.restaurant.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Persona Switcher ONLY for SaaS Super Admin (`admin`) */}
                  {user?.role === "admin" && (
                    <>
                      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                        <ArrowRightLeft className="size-3" />
                        <span>Switch Role Persona</span>
                      </div>

                      <div className="space-y-1 my-1">
                        <button
                          type="button"
                          onClick={() => handleRoleSwitch("admin")}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                            currentRole === "admin"
                              ? "bg-purple-500/20 text-purple-300 font-semibold"
                              : "hover:bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          <span>👑 SaaS Platform Owner</span>
                          <span className="text-[10px] text-neutral-500">Tenants</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRoleSwitch("manager")}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                            currentRole === "manager"
                              ? "bg-blue-500/20 text-blue-300 font-semibold"
                              : "hover:bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          <span>🏢 Restaurant Owner</span>
                          <span className="text-[10px] text-neutral-500">Sales/Mgt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRoleSwitch("cashier")}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                            currentRole === "cashier"
                              ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                              : "hover:bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          <span>💳 Cashier Staff</span>
                          <span className="text-[10px] text-neutral-500">POS</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRoleSwitch("kitchen")}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                            currentRole === "kitchen"
                              ? "bg-orange-500/20 text-orange-300 font-semibold"
                              : "hover:bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          <span>🍳 Kitchen Staff</span>
                          <span className="text-[10px] text-neutral-500">KDS</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-neutral-800 mt-2 space-y-1">
                        <Link
                          href="/select-role"
                          onClick={() => setRoleMenuOpen(false)}
                          className="w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between text-purple-300 hover:bg-purple-950/40 border border-purple-500/20 font-medium transition-colors"
                        >
                          <span>Role Launcher Screen</span>
                          <span className="text-[10px] text-purple-400">View →</span>
                        </Link>
                      </div>
                    </>
                  )}

                  <div className="pt-2 border-t border-neutral-800 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRoleMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-md text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-1.5 transition-colors font-medium"
                    >
                      <LogOut className="size-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            <Link
              href="/tenants"
              className="block rounded-md px-3 py-2 text-sm font-semibold text-purple-400 hover:bg-purple-900/20"
              onClick={mobile.onClose}
            >
              👑 SaaS Tenants Management
            </Link>
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
            <Link
              href="/login"
              className="block rounded-md px-3 py-2 text-sm font-medium text-orange-500 hover:bg-orange-500/10"
              onClick={mobile.onClose}
            >
              Switch Role / Sign In
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
