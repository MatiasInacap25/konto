import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanGate } from "@/components/shared/plan-gate";
import { RunwayClient } from "@/components/runway/runway-client";
import { RunwaySkeleton } from "@/components/runway/runway-skeleton";
import { getRunwayData } from "@/lib/queries/runway";

type RunwayPageProps = {
  searchParams: Promise<{
    workspace?: string;
  }>;
};

async function RunwayContent({ workspaceId }: { workspaceId: string }) {
  const data = await getRunwayData(workspaceId);

  if (!data) {
    redirect("/dashboard");
  }

  return <RunwayClient data={data} />;
}

export default async function RunwayPage({ searchParams }: RunwayPageProps) {
  const [user, params] = await Promise.all([getUser(), searchParams]);
  if (!user) {
    redirect("/login");
  }

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

  // Ownership is validated inside getRunwayData — no redundant query needed

  return (
    <PlanGate requiredPlan="PRO" behavior="blur">
      <Suspense key={workspaceId} fallback={<RunwaySkeleton />}>
        <RunwayContent workspaceId={workspaceId} />
      </Suspense>
    </PlanGate>
  );
}
