import { Suspense } from "react";
import { HallsListPage } from "@/features/halls/halls-list-page";

export default async function HallsPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading halls…</div>}>
      <HallsListPage branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
