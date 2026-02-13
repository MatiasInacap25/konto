import { Skeleton } from "@/components/ui/skeleton";

export function TransactionsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <Skeleton className="h-9 w-44" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Type toggle skeleton */}
        <Skeleton className="h-10 w-64 rounded-lg" />

        {/* Secondary filters */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Transaction groups skeleton */}
      {[1, 2, 3].map((group) => (
        <section key={group} className="space-y-3">
          {/* Date header */}
          <div className="flex items-baseline justify-between pb-2 border-b border-border/60">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Transaction rows */}
          <div className="space-y-0.5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="relative flex items-center gap-4 py-3 px-4 -mx-4"
              >
                {/* Left border indicator */}
                <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-muted" />

                {/* Description and metadata */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>

                {/* Amount */}
                <Skeleton className="h-4 w-24" />

                {/* Actions button placeholder */}
                <div className="w-8 h-8" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
