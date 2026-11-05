import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 p-10 text-center dark:border-neutral-800 dark:bg-neutral-900/20",
        className,
      )}
    >
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {title}
      </p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
