import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function ErrorState({
  title,
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100",
        className,
      )}
    >
      <p className="font-medium">{title ?? "Something went wrong"}</p>
      <p className="mt-1 opacity-90">{message}</p>
      {onRetry ? (
        <Button className="mt-3" variant="secondary" type="button" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
