import { Suspense } from "react";
import { KitchenPageClient } from "@/features/kitchen/kitchen-page";

export default async function KitchenPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading Kitchen Display System…</div>}>
      <KitchenPageClient branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
