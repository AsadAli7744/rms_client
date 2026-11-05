"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchItemSalesReport, fetchSalesSummaryReport, fetchMenuItems } from "../orders/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/feedback/spinner";
import {
  Calendar,
  Filter,
  TrendingUp,
  Tag,
  DollarSign,
  Package,
  Layers,
  ChevronDown,
  X,
  Check,
  RefreshCw,
  Percent,
} from "lucide-react";

export function ItemSalesPageClient({ branchId }: { branchId: number }) {
  // Preset dates helper
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);

  // States
  const [datePreset, setDatePreset] = useState<"today" | "week" | "month" | "custom">("month");
  const [startDate, setStartDate] = useState(startOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "total">("daily");

  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
  const [itemSearchText, setItemSearchText] = useState("");

  // Fetch available menu items for the dropdown
  const { data: menuItems = [] } = useQuery({
    queryKey: ["menu-items", branchId],
    queryFn: () => fetchMenuItems(),
  });

  // Query item sales
  const {
    data: report,
    isLoading: reportLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "item-sales-report",
      branchId,
      selectedItemIds.join(","),
      startDate,
      endDate,
      period,
    ],
    queryFn: () =>
      fetchItemSalesReport({
        branch_id: branchId,
        item_ids: selectedItemIds.length > 0 ? selectedItemIds.join(",") : undefined,
        start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
        end_date: endDate ? `${endDate}T23:59:59Z` : undefined,
        period,
      }),
  });

  // Query overall sales summary to get discount metrics
  const { data: summary } = useQuery({
    queryKey: ["sales-summary", branchId, startDate, endDate],
    queryFn: () =>
      fetchSalesSummaryReport({
        branch_id: branchId,
        start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
        end_date: endDate ? `${endDate}T23:59:59Z` : undefined,
      }),
  });

  // Handlers for date presets
  const applyPreset = (preset: "today" | "week" | "month") => {
    setDatePreset(preset);
    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "week") {
      setStartDate(startOfWeekStr);
      setEndDate(todayStr);
    } else if (preset === "month") {
      setStartDate(startOfMonthStr);
      setEndDate(todayStr);
    }
  };

  // Toggle item in multi-select
  const toggleItemSelection = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAllItems = () => {
    setSelectedItemIds([]);
  };

  const filteredMenuItems = useMemo(() => {
    if (!itemSearchText) return menuItems;
    return menuItems.filter((i: any) =>
      i.name.toLowerCase().includes(itemSearchText.toLowerCase()),
    );
  }, [menuItems, itemSearchText]);

  // Selected item names for badges
  const selectedItemNames = useMemo(() => {
    return menuItems.filter((i: any) => selectedItemIds.includes(i.id));
  }, [menuItems, selectedItemIds]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Item Sales Analytics
          </h1>
          <p className="text-sm text-neutral-500">
            Track quantities sold, revenue, and discounts for specific items or overall menu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Date Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Date:
            </span>
            <div className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
              <button
                type="button"
                onClick={() => applyPreset("today")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  datePreset === "today"
                    ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyPreset("week")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  datePreset === "week"
                    ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
                }`}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => applyPreset("month")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  datePreset === "month"
                    ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
                }`}
              >
                This Month
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="h-8 w-36 text-xs"
              />
              <span>to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="h-8 w-36 text-xs"
              />
            </div>
          </div>

          {/* Grouping / Period */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Period:
            </span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="h-8 rounded-md border border-neutral-300 bg-white px-2.5 text-xs text-neutral-800 shadow-xs focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
            >
              <option value="daily">Daily Breakdown</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="total">Total Aggregate</option>
            </select>
          </div>
        </div>

        {/* Multi-Select Items Dropdown Filter */}
        <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <Filter className="h-3.5 w-3.5" /> Items Filter:
            </span>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemDropdownOpen(!itemDropdownOpen)}
                className="flex h-8 items-center gap-2 text-xs"
              >
                {selectedItemIds.length === 0
                  ? "All Menu Items Selected"
                  : `${selectedItemIds.length} Item(s) Selected`}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>

              {itemDropdownOpen && (
                <div className="absolute left-0 z-50 mt-1 w-72 rounded-md border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                  <Input
                    placeholder="Search menu item..."
                    value={itemSearchText}
                    onChange={(e) => setItemSearchText(e.target.value)}
                    className="mb-2 h-7 text-xs"
                    autoFocus
                  />
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5 text-xs dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={selectAllItems}
                      className="font-medium text-neutral-700 hover:underline dark:text-neutral-300"
                    >
                      Select All (Reset)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedItemIds([])}
                      className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="max-h-56 space-y-1 overflow-y-auto pt-1">
                    {filteredMenuItems.map((item: any) => {
                      const selected = selectedItemIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItemSelection(item.id)}
                          className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs transition ${
                            selected
                              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </div>
                      );
                    })}
                    {filteredMenuItems.length === 0 && (
                      <div className="p-2 text-center text-xs text-neutral-500">
                        No items found
                      </div>
                    )}
                  </div>

                  <div className="mt-2 border-t border-neutral-100 pt-1.5 dark:border-neutral-800">
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setItemDropdownOpen(false)}
                    >
                      Apply Filter
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Chips for selected items */}
            {selectedItemNames.map((item: any) => (
              <Badge
                key={item.id}
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                {item.name}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => toggleItemSelection(item.id)}
                />
              </Badge>
            ))}

            {selectedItemIds.length > 0 && (
              <button
                type="button"
                onClick={selectAllItems}
                className="text-xs text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Units Sold */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Total Units Sold</span>
            <Package className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {reportLoading ? (
              <Spinner className="h-6 w-6" />
            ) : (
              (report?.summary.total_units_sold ?? 0).toLocaleString()
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {selectedItemIds.length > 0
              ? `Across ${selectedItemIds.length} selected items`
              : "Across all menu items"}
          </p>
        </Card>

        {/* Total Item Revenue */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Gross Item Revenue</span>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {reportLoading ? (
              <Spinner className="h-6 w-6" />
            ) : (
              `$${(report?.summary.total_revenue ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-500">From customer & waiter orders</p>
        </Card>

        {/* Total Discounts Given */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Total Discounts Given</span>
            <Percent className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-500">
            {summary?.metrics.total_discounts != null
              ? `$${summary.metrics.total_discounts.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "$0.00"}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {summary?.metrics.discounted_orders_count ?? 0} orders received discounts
          </p>
        </Card>

        {/* Net Sales */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Net Sales</span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {summary?.metrics.net_sales != null
              ? `$${summary.metrics.net_sales.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "$0.00"}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {summary?.metrics.completed_orders ?? 0} orders completed
          </p>
        </Card>
      </div>

      {/* Time Trend Timeline (Weekly / Monthly / Daily) */}
      {report?.timeline && report.timeline.length > 0 && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Sales Trend ({period})
              </h2>
              <p className="text-xs text-neutral-500">
                Quantity and revenue grouped by {period} period
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {report.timeline.length} periods
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
            {report.timeline.map((bucket) => (
              <div
                key={bucket.date}
                className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-center dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  {bucket.date}
                </div>
                <div className="mt-1 text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {bucket.total_quantity} <span className="text-xs font-normal text-neutral-500">sold</span>
                </div>
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  ${bucket.total_revenue.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Detailed Item Sales Table */}
      <Card className="overflow-hidden">
        <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Item Quantity & Revenue Breakdown
          </h2>
          <p className="text-xs text-neutral-500">
            Showing individual performance for {report?.items.length ?? 0} menu items in selected date filter.
          </p>
        </div>

        {reportLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8 text-neutral-400" />
          </div>
        ) : !report?.items.length ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-neutral-300" />
            <h3 className="mt-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No sales data for selected filters
            </h3>
            <p className="text-xs text-neutral-500">
              Try selecting a wider date range or different items.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
                <tr>
                  <th className="px-5 py-3">Menu Item</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3 text-right">Qty Sold</th>
                  <th className="px-5 py-3 text-right">Avg Unit Price</th>
                  <th className="px-5 py-3 text-right">Total Revenue</th>
                  <th className="px-5 py-3 text-right">% Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {report.items.map((item) => {
                  const percentShare =
                    report.summary.total_revenue > 0
                      ? Math.round((item.total_revenue / report.summary.total_revenue) * 100)
                      : 0;

                  return (
                    <tr
                      key={item.item_id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                    >
                      <td className="px-5 py-3.5 font-medium text-neutral-900 dark:text-neutral-100">
                        {item.item_name}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-neutral-500">
                        <Badge variant="outline">{item.category_name}</Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-neutral-500">
                        {item.sku || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-neutral-900 dark:text-neutral-100">
                        {item.total_quantity.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-neutral-600 dark:text-neutral-400">
                        ${item.avg_price_per_unit.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        ${item.total_revenue.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {percentShare}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Discounts Breakdown Card */}
      {summary?.discounts_by_reason && summary.discounts_by_reason.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Discounts Given in this Period
              </h2>
              <p className="text-xs text-neutral-500">
                Detailed discount distribution by reason/type
              </p>
            </div>
            <Badge variant="secondary" className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Total: ${summary.metrics.total_discounts.toFixed(2)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {summary.discounts_by_reason.map((d) => (
              <div
                key={d.reason}
                className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {d.reason}
                  </div>
                  <div className="text-neutral-500">{d.count} orders</div>
                </div>
                <div className="text-right font-bold text-amber-600 dark:text-amber-400">
                  -${d.total_amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
