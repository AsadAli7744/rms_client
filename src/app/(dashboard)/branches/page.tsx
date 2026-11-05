import { Suspense } from "react";
import { BranchesPageClient } from "@/features/branches/branches-page";

export default function BranchesPage() {
  return (
    <Suspense
      fallback={<div className="px-4 py-10 text-sm text-neutral-500">Loading branches…</div>}
    >
      <BranchesPageClient />
    </Suspense>
  );
}
