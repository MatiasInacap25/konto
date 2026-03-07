import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { BudgetsClient, PageSkeleton } from "@/components/budgets";
import { getBudgetsWithProgress } from "@/lib/queries/budgets";

type PageProps = {
  searchParams: Promise<{ workspace?: string }>;
};

async function BudgetsContent({ workspaceId }: { workspaceId: string }) {
  // Get budgets with progress
  const budgets = await getBudgetsWithProgress(workspaceId);

  // Get EXPENSE categories for the budget form
  const expenseCategories = await prisma.category.findMany({
    where: {
      type: "EXPENSE",
      OR: [{ userId: null }, { userId: { not: null } }],
    },
    orderBy: { name: "asc" },
  });

  return (
    <BudgetsClient
      budgets={budgets}
      workspaceId={workspaceId}
      expenseCategories={expenseCategories}
    />
  );
}

export default async function BudgetsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const workspaceId = params.workspace;

  if (!workspaceId) {
    redirect("/");
  }

  // Verify workspace access
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      userId: user.id,
    },
  });

  if (!workspace) {
    redirect("/");
  }

  return (
    <Suspense key={workspaceId} fallback={<PageSkeleton />}>
      <BudgetsContent workspaceId={workspaceId} />
    </Suspense>
  );
}
