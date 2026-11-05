"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function FilterBar({
  children,
  onReset,
  className,
}: {
  children: ReactNode;
  onReset?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {children}
      </div>
      {onReset ? (
        <Button type="button" variant="ghost" onClick={onReset}>
          Reset
        </Button>
      ) : null}
    </div>
  );
}
