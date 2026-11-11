import { Suspense } from "react";
import { HallFormPage } from "@/features/halls/hall-form-page";

export default async function NewHallPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading form…</div>}>
      <HallFormPage branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
