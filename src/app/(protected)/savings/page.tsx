import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SavingsClient, PageSkeleton } from "@/components/savings";
import { getSavingsPageData } from "@/lib/queries/savings";
import { getUser } from "@/lib/auth";

type SavingsPageProps = {
  searchParams: Promise<{ workspace?: string }>;
};

async function SavingsContent({ workspaceId }: { workspaceId: string | undefined }) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  if (!workspaceId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Seleccioná un workspace para ver tus metas</p>
      </div>
    );
  }

  const { goals, accounts } = await getSavingsPageData(workspaceId);

  return <SavingsClient goals={goals} accounts={accounts} workspaceId={workspaceId} />;
}

export default async function SavingsPage({ searchParams }: SavingsPageProps) {
  const params = await searchParams;
  const workspaceId = params.workspace;

  return (
    <Suspense key={workspaceId || "default"} fallback={<PageSkeleton />}>
      <SavingsContent workspaceId={workspaceId} />
    </Suspense>
  );
}
