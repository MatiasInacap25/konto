import { Skeleton } from "@/components/ui/skeleton";

export function AccountsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Total balance card skeleton */}
        <div className="flex items-center gap-4 px-5 py-4 bg-card border rounded-xl">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>

      {/* Action button skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Accounts list skeleton */}
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-4 px-5 bg-card border border-border/60 rounded-xl"
          >
            {/* Icon skeleton */}
            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />

            {/* Account info skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>

            {/* Balance skeleton */}
            <Skeleton className="h-6 w-28 flex-shrink-0" />

            {/* Actions skeleton */}
            <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
