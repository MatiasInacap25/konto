import { Suspense } from "react";
import { AccountsContent } from "@/components/accounts";
import { AccountsSkeleton } from "@/components/accounts";

type AccountsPageProps = {
  searchParams: Promise<{ workspace?: string }>;
};

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const params = await searchParams;
  const workspaceId = params.workspace;

  return (
    <Suspense key={workspaceId || "default"} fallback={<AccountsSkeleton />}>
      <AccountsContent workspaceId={workspaceId} />
    </Suspense>
  );
}
