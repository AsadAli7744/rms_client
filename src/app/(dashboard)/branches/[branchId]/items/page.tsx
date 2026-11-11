import { Suspense } from "react";
import { ItemsPageClient } from "@/features/items/items-page";

export default async function ItemsPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading menu items…</div>}>
      <ItemsPageClient branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
