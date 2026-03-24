"use client";

import { PlanProvider } from "@/components/dashboard/plan-context";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import type { Plan } from "@/types/plans";

export function ProtectedClientLayout({
  children,
  user,
  plan,
}: {
  children: React.ReactNode;
  user: {
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
  plan?: Plan;
}) {
  return (
    <PlanProvider initialPlan={plan}>
      <SidebarProvider>
        <div className="flex h-screen bg-card">
          {children}
        </div>
      </SidebarProvider>
    </PlanProvider>
  );
}
