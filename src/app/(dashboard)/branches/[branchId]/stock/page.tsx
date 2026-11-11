import { Suspense } from "react";
import { StockPageClient } from "@/features/stock/stock-page";

export default async function StockPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading stock inventory…</div>}>
      <StockPageClient branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
