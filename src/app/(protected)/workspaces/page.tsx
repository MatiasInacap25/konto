import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getUserWorkspacesWithCounts } from "@/lib/queries";
import { WorkspacesClient } from "@/components/workspaces/workspaces-client";
import { WorkspacesSkeleton } from "@/components/workspaces/workspaces-skeleton";

async function WorkspacesContent({ userId }: { userId: string }) {
  const workspaces = await getUserWorkspacesWithCounts(userId);

  return <WorkspacesClient workspaces={workspaces} />;
}

export default async function WorkspacesPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<WorkspacesSkeleton />}>
      <WorkspacesContent userId={user.id} />
    </Suspense>
  );
}
