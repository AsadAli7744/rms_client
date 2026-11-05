import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function FormGrid({
  children,
  className,
  columns = 2,
}: {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
}) {
  const cols =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";
  return (
    <div className={cn("grid grid-cols-1 gap-4", cols, className)}>
      {children}
    </div>
  );
}
