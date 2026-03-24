import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanSettingsClient } from "./plan-settings-client";
import type { Plan } from "@/types/plans";

async function getUserPlan(): Promise<Plan | null> {
  const user = await getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  });

  return dbUser?.plan || null;
}

export async function PlanSettings() {
  const plan = await getUserPlan();

  return <PlanSettingsClient initialPlan={plan} />;
}
