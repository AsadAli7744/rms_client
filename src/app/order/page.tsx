import { Suspense } from "react";
import { CustomerOrderPageClient } from "@/features/customer-order/customer-order-page";

export default async function CustomerOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; tableId?: string; restaurantId?: string }>;
}) {
  const params = await searchParams;
  const branchId = params.branchId ? parseInt(params.branchId, 10) : 0;
  const tableId = params.tableId ? parseInt(params.tableId, 10) : 0;
  const restaurantId = params.restaurantId ? parseInt(params.restaurantId, 10) : undefined;

  if (!branchId || !tableId) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500">
        This ordering link is missing a branch or table.
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading menu…</div>}>
      <CustomerOrderPageClient
        branchId={branchId}
        tableId={tableId}
        restaurantId={restaurantId ?? 0}
      />
    </Suspense>
  );
}
