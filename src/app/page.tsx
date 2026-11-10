"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    const branchId = user.branch_id || 1;
    switch (user.role) {
      case "admin":
        router.replace("/select-role");
        break;
      case "manager":
        router.replace(`/branches/${branchId}/item-sales`);
        break;
      case "cashier":
        router.replace(`/branches/${branchId}/cashier`);
        break;
      case "kitchen":
        router.replace(`/branches/${branchId}/kitchen`);
        break;
      case "waiter":
        router.replace(`/branches/${branchId}/cashier`);
        break;
      default:
        router.replace("/branches");
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-300">
      <div className="size-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white mb-4 animate-pulse">
        RMS
      </div>
      <p className="text-sm">Loading Multi-Tenant Workspace...</p>
    </div>
  );
}
