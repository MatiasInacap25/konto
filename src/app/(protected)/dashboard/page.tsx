import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

type DashboardPageProps = {
  searchParams: Promise<{ workspace?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const workspaceId = params.workspace || "default";

  return (
    <Suspense key={workspaceId} fallback={<DashboardSkeleton />}>
      <DashboardContent workspaceId={params.workspace} />
    </Suspense>
  );
}
