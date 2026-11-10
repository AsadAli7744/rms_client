"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { branchNav, topNav, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { useSidebar } from "./sidebar-context";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

function matches(pathname: string, item: NavItem) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function Sidebar({
  branchId,
}: {
  /** When set, shows branch-scoped navigation. */
  branchId?: string;
}) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { collapsed, toggle } = useSidebar();

  const items: NavItem[] = branchId
    ? [...topNav, ...branchNav(branchId)]
    : topNav;

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 lg:flex lg:flex-col lg:justify-between transition-all duration-300 ease-in-out select-none",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Top Section */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header / Collapse Action */}
        <div
          className={cn(
            "flex items-center h-14 border-b border-neutral-200 dark:border-neutral-800 px-3",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="rounded bg-orange-600 px-1.5 py-0.5 text-xs font-bold text-white shadow-sm shrink-0">
                RMS
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 truncate">
                Navigation
              </span>
            </div>
          ) : (
            <span className="rounded bg-orange-600 px-1.5 py-0.5 text-xs font-bold text-white shadow-sm">
              R
            </span>
          )}

          {/* Toggle Button */}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-900 transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {items.map((item) => {
            const active = matches(pathname, item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-colors group relative",
                  collapsed
                    ? "justify-center p-2.5"
                    : "gap-3 px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
                    : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "shrink-0 size-4.5 transition-transform group-hover:scale-105",
                    active
                      ? "text-orange-400 dark:text-orange-600"
                      : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200",
                  )}
                />

                {!collapsed && (
                  <span className="truncate">{item.title}</span>
                )}

                {/* Floating tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 hidden group-hover:flex items-center px-2 py-1 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-md shadow-lg z-50 whitespace-nowrap pointer-events-none">
                    {item.title}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Session Footer Card */}
      <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
        {isAuthenticated && user ? (
          collapsed ? (
            /* Compact Collapsed Footer */
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                title={`${user.name} (${user.role.toUpperCase()})`}
                className="size-8 rounded-full bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs"
              >
                {user.name.charAt(0)}
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            /* Expanded Full Footer */
            <div className="space-y-2 p-2">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                    {user.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
                {user.role === "admin" ? (
                  <Link
                    href="/select-role"
                    className="text-[11px] text-purple-500 hover:underline"
                  >
                    Switch Role
                  </Link>
                ) : (
                  <div></div>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-400 font-medium ml-auto"
                >
                  <LogOut className="size-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )
        ) : (
          collapsed ? (
            <Link
              href="/login"
              title="Sign In"
              className="flex justify-center p-2 rounded-lg bg-orange-600 text-white hover:bg-orange-500"
            >
              <UserCheck className="size-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition-colors"
            >
              <UserCheck className="size-3.5" />
              <span>Sign In</span>
            </Link>
          )
        )}
      </div>
    </aside>
  );
}
