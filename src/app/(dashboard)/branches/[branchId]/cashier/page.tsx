import { Suspense } from "react";
import { CashierPageClient } from "@/features/cashier/cashier-page";

export default async function CashierPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading Cashier Terminal…</div>}>
      <CashierPageClient branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
