import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportsClient, ReportsSkeleton } from "@/components/reports";
import { getMonthlyReport, getAvailableMonths } from "@/lib/queries/reports";

type ReportsPageProps = {
  searchParams: Promise<{
    workspace?: string;
    year?: string;
    month?: string;
  }>;
};

async function ReportsContent({
  workspaceId,
  year,
  month,
}: {
  workspaceId: string;
  year: number;
  month: number;
}) {
  const [report, availableMonths] = await Promise.all([
    getMonthlyReport(workspaceId, year, month),
    getAvailableMonths(workspaceId),
  ]);

  // Get workspace currency
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { currency: true },
  });

  return (
    <ReportsClient
      report={report}
      availableMonths={availableMonths}
      currency={workspace?.currency || "CLP"}
      workspaceId={workspaceId}
    />
  );
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  
  // Get workspace - use first one if not specified
  let workspaceId = params.workspace;
  if (!workspaceId) {
    const firstWorkspace = await prisma.workspace.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    
    if (!firstWorkspace) {
      redirect("/workspaces");
    }
    
    workspaceId = firstWorkspace.id;
  }

  // Validate workspace belongs to user
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      userId: user.id,
    },
  });

  if (!workspace) {
    redirect("/dashboard");
  }

  // Default to current month if not specified
  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;

  const cacheKey = `${workspaceId}-${year}-${month}`;

  return (
    <Suspense key={cacheKey} fallback={<ReportsSkeleton />}>
      <ReportsContent workspaceId={workspaceId} year={year} month={month} />
    </Suspense>
  );
}
