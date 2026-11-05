"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { branchNav, topNav, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/auth-context";
import { Building2, ShieldCheck, UserCheck, LogOut } from "lucide-react";

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
  const items: NavItem[] = branchId
    ? [...topNav, ...branchNav(branchId)]
    : topNav;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 lg:flex lg:flex-col lg:justify-between">
      <div className="px-4 py-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Navigation
          </div>
          <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30">
            SaaS v2.0
          </span>
        </div>

        <div className="mt-4 space-y-1">
          {items.map((item) => {
            const active = matches(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Session Footer Card */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
        {isAuthenticated && user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs">
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
              <Link
                href="/login"
                className="text-[11px] text-blue-500 hover:underline"
              >
                Switch Role
              </Link>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-400 font-medium"
              >
                <LogOut className="size-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition-colors"
          >
            <UserCheck className="size-3.5" />
            <span>Sign In to Your Role</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
