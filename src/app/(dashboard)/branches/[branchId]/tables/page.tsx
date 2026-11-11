import { Suspense } from "react";
import { TablesListPage } from "@/features/tables/tables-list-page";

export default async function TablesPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading tables…</div>}>
      <TablesListPage branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
