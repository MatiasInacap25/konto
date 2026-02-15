import { Skeleton } from "@/components/ui/skeleton";

export function CategoriesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Grid */}
      <div className="space-y-8">
        <div>
          <Skeleton className="h-4 w-16 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
