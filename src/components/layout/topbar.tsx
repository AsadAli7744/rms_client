"use client";

import Link from "next/link";
import { Menu, UtensilsCrossed, Banknote, BarChart3, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDisclosure } from "@/hooks/use-disclosure";
import { branchNav, topNav } from "@/config/nav";
import { cn } from "@/lib/utils/cn";

export function Topbar({ branchId }: { branchId?: string }) {
  const mobile = useDisclosure(false);
  const items = branchId ? [...topNav, ...branchNav(branchId)] : topNav;
  const activeBranch = branchId || "1";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:max-w-none">
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
          <Link href="/branches" className="text-sm font-semibold flex items-center gap-2">
            <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs font-bold text-white dark:bg-neutral-100 dark:text-neutral-900">RMS</span>
            Multi-Tenant SaaS
          </Link>
        </div>

        {/* Quick Role Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            href={`/branches/${activeBranch}/item-sales`}
            className="hidden sm:inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
            <span>Item Sales</span>
          </Link>

          <Link
            href={`/branches/${activeBranch}/cashier`}
            className="hidden sm:inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <Banknote className="h-3.5 w-3.5 text-emerald-600" />
            <span>Cashier POS</span>
          </Link>

          <Link
            href={`/branches/${activeBranch}/kitchen`}
            className="hidden sm:inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <UtensilsCrossed className="h-3.5 w-3.5 text-orange-600" />
            <span>Kitchen KDS</span>
          </Link>

          <Link
            href={`/order?branchId=${activeBranch}&tableId=1`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/60 dark:text-orange-200"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Scan QR View</span>
          </Link>
        </div>
      </div>
      {mobile.open ? (
        <div className="border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950 lg:hidden">
          <div className="space-y-1">
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
          </div>
        </div>
      ) : null}
    </header>
  );
}
