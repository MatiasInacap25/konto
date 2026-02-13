import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TransactionsContent } from "@/components/transactions/transactions-content";
import { TransactionsSkeleton } from "@/components/transactions/transactions-skeleton";

type PageProps = {
  searchParams: Promise<{
    workspace?: string;
    type?: string;
    account?: string;
    category?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function TransactionsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  
  // Use workspaceId + filters as key to re-trigger Suspense on any change
  const suspenseKey = JSON.stringify({
    workspace: params.workspace,
    type: params.type,
    account: params.account,
    category: params.category,
    from: params.from,
    to: params.to,
  });

  return (
    <Suspense key={suspenseKey} fallback={<TransactionsSkeleton />}>
      <TransactionsContent
        userId={user.id}
        workspaceId={params.workspace}
        filters={{
          type: params.type,
          account: params.account,
          category: params.category,
          from: params.from,
          to: params.to,
        }}
      />
    </Suspense>
  );
}
