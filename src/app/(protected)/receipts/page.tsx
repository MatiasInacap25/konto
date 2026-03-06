import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { PlanGate } from "@/components/shared/plan-gate";
import { ReceiptsClient } from "@/components/receipts/receipts-client";
import { ReceiptsSkeleton } from "@/components/receipts/receipts-skeleton";
import { getReceiptsPageData } from "@/lib/queries/receipts";

type ReceiptsPageProps = {
  searchParams: Promise<{
    workspace?: string;
  }>;
};

async function ReceiptsContent({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId?: string;
}) {
  const data = await getReceiptsPageData(userId, workspaceId);

  if (!data) {
    redirect("/dashboard");
  }

  return (
    <ReceiptsClient
      receipts={data.receipts}
      accounts={data.accounts}
      categories={data.categories}
      workspaceId={data.workspace.id}
      workspaceType={data.workspace.type as "PERSONAL" | "BUSINESS"}
      currency={data.workspace.currency}
    />
  );
}

export default async function ReceiptsPage({
  searchParams,
}: ReceiptsPageProps) {
  const [user, params] = await Promise.all([getUser(), searchParams]);
  if (!user) {
    redirect("/login");
  }

  return (
    <PlanGate requiredPlan="PRO" behavior="blur">
      <Suspense key={params.workspace} fallback={<ReceiptsSkeleton />}>
        <ReceiptsContent userId={user.id} workspaceId={params.workspace} />
      </Suspense>
    </PlanGate>
  );
}
