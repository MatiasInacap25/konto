import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaxRulesClient, TaxRulesSkeleton } from "@/components/tax-rules";
import { getTaxRules } from "@/actions/tax-rules";

type TaxRulesPageProps = {
  searchParams: Promise<{ workspace?: string }>;
};

async function TaxRulesContent({ workspaceId }: { workspaceId: string }) {
  const taxRules = await getTaxRules(workspaceId);

  // Transform Decimal to number
  const transformedTaxRules = taxRules.map((rule) => ({
    ...rule,
    percentage: Number(rule.percentage),
  }));

  return (
    <TaxRulesClient
      taxRules={transformedTaxRules}
      workspaceId={workspaceId}
    />
  );
}

export default async function TaxRulesPage({ searchParams }: TaxRulesPageProps) {
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
    <Suspense fallback={<TaxRulesSkeleton />}>
      <TaxRulesContent workspaceId={workspaceId} />
    </Suspense>
  );
}
