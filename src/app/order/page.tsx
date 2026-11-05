import { Suspense } from "react";
import { CustomerOrderPageClient } from "@/features/customer-order/customer-order-page";

export default async function CustomerOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; tableId?: string; restaurantId?: string }>;
}) {
  const params = await searchParams;
  const branchId = params.branchId ? parseInt(params.branchId, 10) : 1;
  const tableId = params.tableId ? parseInt(params.tableId, 10) : 1;
  const restaurantId = params.restaurantId ? parseInt(params.restaurantId, 10) : 1;

  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 text-center">Loading menu…</div>}>
      <CustomerOrderPageClient
        branchId={branchId}
        tableId={tableId}
        restaurantId={restaurantId}
      />
    </Suspense>
  );
}
