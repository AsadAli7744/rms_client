import { Suspense } from "react";
import { FloorsListPage } from "@/features/floors/floors-list-page";

export default async function FloorsPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading floors…</div>}>
      <FloorsListPage branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
