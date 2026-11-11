import { Suspense } from "react";
import { FloorFormPage } from "@/features/floors/floor-form-page";

export default async function NewFloorPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading form…</div>}>
      <FloorFormPage branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
