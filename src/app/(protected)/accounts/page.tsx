import { Suspense } from "react";
import { AccountsContent } from "@/components/accounts";
import { AccountsSkeleton } from "@/components/accounts";

type AccountsPageProps = {
  searchParams: Promise<{ workspace?: string; archived?: string }>;
};

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const params = await searchParams;
  const workspaceId = params.workspace;
  const showArchived = params.archived === "true";

  // Key must include both workspace and archived params to trigger re-fetch
  const suspenseKey = `${workspaceId || "default"}-${showArchived ? "archived" : "active"}`;

  return (
    <Suspense key={suspenseKey} fallback={<AccountsSkeleton />}>
      <AccountsContent workspaceId={workspaceId} showArchived={showArchived} />
    </Suspense>
  );
}
