import { Suspense } from "react";
import { ItemSalesPageClient } from "@/features/reports/item-sales-page";

export default async function ItemSalesPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading sales analytics…</div>}>
      <ItemSalesPageClient branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
