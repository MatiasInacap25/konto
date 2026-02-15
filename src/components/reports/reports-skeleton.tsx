import { Skeleton } from "@/components/ui/skeleton";

export function ReportsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Hero Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border rounded-xl p-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32 mt-2" />
            <Skeleton className="h-4 w-40 mt-3" />
          </div>
        ))}
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card border rounded-xl p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-80 w-full" />
        </div>
        <div className="lg:col-span-2 bg-card border rounded-xl p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-card border rounded-xl p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
