import { Suspense } from "react";
import { ReservationsListPage } from "@/features/reservations/reservations-list-page";

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading reservations…</div>}>
      <ReservationsListPage branchId={parseInt(branchId, 10)} />
    </Suspense>
  );
}
