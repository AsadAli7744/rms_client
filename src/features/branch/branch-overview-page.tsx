"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useRestaurantCurrency } from "@/hooks/use-restaurant-currency";
import { useDiningTablesQuery, useFloorsQuery, useHallsQuery, useReservationsQuery } from "@/features/branch/hooks";
import { fetchMenuItems } from "@/features/orders/api";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/spinner";
import { TableQrDialog } from "@/components/ui/table-qr-dialog";
import { toast } from "sonner";
import {
  Store,
  QrCode,
  Layers,
  DoorOpen,
  Calendar,
  MapPin,
  Utensils,
  Package,
  Banknote,
  UtensilsCrossed,
  BarChart3,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export function BranchOverviewPage({ branchId }: { branchId: number }) {
  const { user } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [showOverviewQr, setShowOverviewQr] = useState(false);

  // Fetch branch details
  const { data: branch, isLoading: branchLoading, error: branchError } = useQuery({
    queryKey: ["branch", branchId],
    queryFn: async () => {
      const { data } = await api.get(`/branches/${branchId}`);
      return data;
    },
    enabled: Boolean(branchId),
  });

  const restaurantId = branch?.restaurant_id || user?.restaurant_id;
  const { symbol: currencySymbol } = useRestaurantCurrency(restaurantId);

  // Queries for stats
  const tablesQuery = useDiningTablesQuery(branchId);
  const floorsQuery = useFloorsQuery(branchId, 1, 100);
  const hallsQuery = useHallsQuery(branchId, undefined, 1, 100);
  const reservationsQuery = useReservationsQuery(branchId, 1, 50);
  const menuItemsQuery = useQuery({
    queryKey: ["menu-items", restaurantId],
    queryFn: () => fetchMenuItems(restaurantId),
  });

  const tables = tablesQuery.data ?? [];
  const floorsCount = floorsQuery.data?.total ?? floorsQuery.data?.data?.length ?? 0;
  const hallsCount = hallsQuery.data?.total ?? hallsQuery.data?.data?.length ?? 0;
  const reservationsCount = reservationsQuery.data?.total ?? reservationsQuery.data?.data?.length ?? 0;
  const menuItemsCount = menuItemsQuery.data?.length ?? 0;

  const availableTables = tables.filter((t: any) => t.status === "available").length;
  const occupiedTables = tables.filter((t: any) => t.status === "occupied").length;

  const previewTable = tables[0] ?? null;
  const qrOrderUrl = previewTable
    ? typeof window !== "undefined"
      ? `${window.location.origin}/order?branchId=${branchId}&tableId=${previewTable.id}`
      : `/order?branchId=${branchId}&tableId=${previewTable.id}`
    : "";

  const copyQrLink = () => {
    if (!qrOrderUrl) {
      toast.error("Add a dining table before copying a QR link.");
      return;
    }
    navigator.clipboard.writeText(qrOrderUrl);
    setCopiedLink(true);
    toast.success("Customer QR order link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (branchLoading) {
    return (
      <PageContainer>
        <div className="flex h-64 items-center justify-center text-neutral-500">
          <Spinner className="mr-2 size-5" />
          <span>Loading branch overview…</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Branch Title & Quick Status */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-orange-500/10 p-2 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                <Store className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  {branch?.name || `Branch #${branchId}`}
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Code: <span className="font-mono font-medium">{branch?.code || "—"}</span> •{" "}
                  {branch?.city ? `${branch.city}, ` : ""}
                  {branch?.state ? `${branch.state}, ` : ""}
                  {branch?.country || "Default Location"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                branch?.branch_status === "active"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-neutral-500/30 bg-neutral-500/10 text-neutral-400"
              }
            >
              {branch?.branch_status === "active" ? "● Active Branch" : "Inactive"}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await Promise.all([
                  tablesQuery.refetch(),
                  floorsQuery.refetch(),
                  hallsQuery.refetch(),
                  reservationsQuery.refetch(),
                  menuItemsQuery.refetch(),
                ]);
                toast.success("Branch overview refreshed");
              }}
              disabled={tablesQuery.isFetching}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${tablesQuery.isFetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={copyQrLink}
              className="text-xs gap-1.5"
            >
              {copiedLink ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              <span>Copy QR Order Link</span>
            </Button>

            <Button
              size="sm"
              asChild
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs gap-1.5"
            >
              <Link href={qrOrderUrl || `/branches/${branchId}/tables`} target="_blank">
                <QrCode className="size-3.5" />
                <span>Open Customer QR View</span>
                <ExternalLink className="size-3 opacity-70" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
              <span>Dining Tables</span>
              <QrCode className="size-4 text-orange-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
              {tables.length}
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              <span className="text-emerald-500 font-semibold">{availableTables} available</span> •{" "}
              <span className="text-amber-500 font-semibold">{occupiedTables} occupied</span>
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
              <span>Floors & Halls</span>
              <Layers className="size-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
              {floorsCount} / {hallsCount}
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              {floorsCount} floor(s) across {hallsCount} dining hall(s)
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
              <span>Reservations</span>
              <Calendar className="size-4 text-purple-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
              {reservationsCount}
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">Booked guest reservations</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
              <span>Menu Items</span>
              <Utensils className="size-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
              {menuItemsCount}
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">Active dishes in catalog ({currencySymbol.trim()})</p>
          </Card>
        </div>

        {/* Quick Operations Navigation Grid */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
            Branch Operations & Management
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Tables & QR */}
            <Link
              href={`/branches/${branchId}/tables`}
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition shadow-xs group"
            >
              <div className="rounded-lg bg-orange-500/10 p-2 text-orange-500 group-hover:scale-105 transition-transform">
                <QrCode className="size-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-orange-500 transition-colors">
                  Tables & QR Codes
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Manage dining tables, statuses, and customer QR ordering codes.
                </p>
              </div>
            </Link>

            {/* Seating Map */}
            <Link
              href={`/branches/${branchId}/seating-map`}
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition shadow-xs group"
            >
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 group-hover:scale-105 transition-transform">
                <MapPin className="size-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-blue-500 transition-colors">
                  Visual Seating Map
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Live visual layout of tables grouped by floor and hall.
                </p>
              </div>
            </Link>

            {/* Floors */}
            <Link
              href={`/branches/${branchId}/floors`}
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition shadow-xs group"
            >
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 group-hover:scale-105 transition-transform">
                <Layers className="size-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                  Floors
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure building levels and dining floors.
                </p>
              </div>
            </Link>

            {/* Halls */}
            <Link
              href={`/branches/${branchId}/halls`}
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-cyan-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition shadow-xs group"
            >
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-500 group-hover:scale-105 transition-transform">
                <DoorOpen className="size-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                  Dining Halls
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Manage halls, dining sections, and family rooms.
                </p>
              </div>
            </Link>

            {/* Reservations */}
            <Link
              href={`/branches/${branchId}/reservations`}
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-purple-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition shadow-xs group"
            >
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500 group-hover:scale-105 transition-transform">
                <Calendar className="size-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-purple-500 transition-colors">
                  Guest Reservations
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  View booked guest lists, times, and seating dates.
                </p>
              </div>
            </Link>

            {/* Item Sales Dashboard */}
            <Link
              href={`/branches/${branchId}/item-sales`}
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition shadow-xs group"
            >
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500 group-hover:scale-105 transition-transform">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                  Item Sales Dashboard
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Revenue analytics, best-sellers, and item breakdown.
                </p>
              </div>
            </Link>

            {/* Cashier POS */}
            <Link
              href={`/branches/${branchId}/cashier`}
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-amber-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition shadow-xs group"
            >
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500 group-hover:scale-105 transition-transform">
                <Banknote className="size-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  Cashier POS Terminal
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Order settlement, bill discounts, deliveries, and payment.
                </p>
              </div>
            </Link>

            {/* Kitchen KDS */}
            <Link
              href={`/branches/${branchId}/kitchen`}
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-red-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition shadow-xs group"
            >
              <div className="rounded-lg bg-red-500/10 p-2 text-red-500 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="size-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-red-500 transition-colors">
                  Kitchen Display System (KDS)
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Real-time live ticket queue and preparation station timers.
                </p>
              </div>
            </Link>

            {/* Stock & Inventory */}
            <Link
              href={`/branches/${branchId}/stock`}
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition shadow-xs group"
            >
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 group-hover:scale-105 transition-transform">
                <Package className="size-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-blue-500 transition-colors">
                  Stock & Inventory
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Tracked stock levels, replenishment, and valuations.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Customer Self-Ordering QR Banner */}
        <div className="rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/5 via-orange-500/10 to-transparent p-5 dark:border-orange-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <QrCode className="size-5 text-orange-500" />
                <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                  Customer QR Dine-In & Self-Ordering
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
                Guests at dining tables can scan table QR codes to view the digital menu, customize items, and submit orders directly to the Kitchen and Cashier screens.
              </p>
              <div className="pt-1 font-mono text-[11px] text-neutral-400 select-all">
                URL: {qrOrderUrl}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOverviewQr(true)}
                className="text-xs gap-1.5"
              >
                <QrCode className="size-3.5" />
                <span>Show Scannable QR</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyQrLink}
                className="text-xs gap-1.5"
              >
                {copiedLink ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-orange-600 hover:bg-orange-500 text-white text-xs gap-1.5"
              >
                <Link href={qrOrderUrl || `/branches/${branchId}/tables`} target="_blank">
                  <ExternalLink className="size-3.5" />
                  <span>Launch QR View</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Real Scannable QR Dialog from Overview */}
        {previewTable ? (
          <TableQrDialog
            table={previewTable}
            branchId={branchId}
            open={showOverviewQr}
            onOpenChange={setShowOverviewQr}
          />
        ) : null}
      </div>
    </PageContainer>
  );
}
