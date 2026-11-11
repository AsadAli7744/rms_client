import { Suspense } from "react";
import { SeatingMapPage } from "@/features/seating/seating-map-page";

export default async function SeatingMapRoute({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading seating map…</div>}>
      <SeatingMapPage branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
