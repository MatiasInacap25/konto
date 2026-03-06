import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecurringClient } from "@/components/recurrings/recurring-client";
import { RecurringsSkeleton } from "@/components/recurrings/recurrings-skeleton";
import { getRecurrings } from "@/actions/recurrings";

type RecurringsPageProps = {
  searchParams: Promise<{ workspace?: string }>;
};

async function RecurringsContent({ workspaceId }: { workspaceId: string }) {
  const [recurrings, accounts, categories, workspace] = await Promise.all([
    getRecurrings(workspaceId),
    prisma.account.findMany({
      where: { workspaceId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { user: null }, // Get all categories for now
      select: { id: true, name: true, icon: true, type: true },
      orderBy: { name: "asc" },
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { currency: true },
    }),
  ]);

  // Transform categories to the format expected by the component
  const categoryOptions = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
  }));

  // Transform recurrings to convert Decimal to number
  const transformedRecurrings = recurrings.map((rec) => ({
    ...rec,
    amount: Number(rec.amount),
  }));

  return (
    <RecurringClient
      recurrings={transformedRecurrings}
      workspaceId={workspaceId}
      currency={workspace?.currency || "CLP"}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      categories={categoryOptions}
    />
  );
}

export default async function RecurringsPage({ searchParams }: RecurringsPageProps) {
  const [user, params] = await Promise.all([getUser(), searchParams]);
  if (!user) {
    redirect("/login");
  }

  let workspaceId = params.workspace;

  // Get workspace - use first one if not specified
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

  // Ownership validated inside getRecurrings server action — no redundant query needed

  return (
    <Suspense fallback={<RecurringsSkeleton />}>
      <RecurringsContent workspaceId={workspaceId} />
    </Suspense>
  );
}
