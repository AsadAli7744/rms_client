import { Suspense } from "react";
import { BranchOverviewPage } from "@/features/branch/branch-overview-page";

export default async function BranchPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading branch overview…</div>}>
      <BranchOverviewPage branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
