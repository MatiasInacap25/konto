import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecurringClient, RecurringsSkeleton } from "@/components/recurrings";
import { getRecurrings } from "@/actions/recurrings";

type RecurringsPageProps = {
  searchParams: Promise<{ workspace?: string }>;
};

async function RecurringsContent({ workspaceId }: { workspaceId: string }) {
  const [recurrings, accounts, categories] = await Promise.all([
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
  ]);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { currency: true },
  });

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
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
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

  return (
    <Suspense fallback={<RecurringsSkeleton />}>
      <RecurringsContent workspaceId={workspaceId} />
    </Suspense>
  );
}
