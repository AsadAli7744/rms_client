import { Suspense } from "react";
import { TableFormPage } from "@/features/tables/table-form-page";

export default async function NewTablePage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading form…</div>}>
      <TableFormPage branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
