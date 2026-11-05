"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { branchNav, topNav, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils/cn";

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
  const items: NavItem[] = branchId
    ? [...topNav, ...branchNav(branchId)]
    : topNav;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 lg:block">
      <div className="px-4 py-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          RMS
        </div>
        <div className="mt-4 space-y-1">
          {items.map((item) => {
            const active = matches(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium",
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
    </aside>
  );
}
